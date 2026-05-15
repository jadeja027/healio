from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MessageRecord, SessionRecord
from app.schemas import (
    AssessOut,
    AssessRequest,
    MessageIn,
    MessageOut,
    SessionCreate,
    SessionOut,
)
from app.services.assessment import build_assessment
from app.services.llm_service import generate_assistant_reply

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _sid(session_id: UUID) -> str:
    return str(session_id)


@router.post("", response_model=SessionOut)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    row = SessionRecord(patient=payload.patient.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: UUID, db: Session = Depends(get_db)):
    row = db.get(SessionRecord, _sid(session_id))
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return row


@router.get("/{session_id}/messages", response_model=list[MessageOut])
def list_messages(session_id: UUID, db: Session = Depends(get_db)):
    sid = _sid(session_id)
    row = db.get(SessionRecord, sid)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    msgs = (
        db.query(MessageRecord)
        .filter(MessageRecord.session_id == sid)
        .order_by(MessageRecord.created_at.asc())
        .all()
    )
    return msgs


@router.post("/{session_id}/messages", response_model=list[MessageOut])
def append_message(session_id: UUID, payload: MessageIn, db: Session = Depends(get_db)):
    sid = _sid(session_id)
    row = db.get(SessionRecord, sid)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    user_msg = MessageRecord(session_id=sid, role="user", content=payload.content)
    db.add(user_msg)
    db.commit()

    history_msgs = (
        db.query(MessageRecord)
        .filter(MessageRecord.session_id == sid)
        .order_by(MessageRecord.created_at.asc())
        .all()
    )
    history: list[tuple[str, str]] = []
    for m in history_msgs[:-1]:
        history.append((m.role, m.content))

    try:
        reply_text = generate_assistant_reply(history, payload.content)
    except ValueError:
        reply_text = (
            "Healio triage chat is offline because ANTHROPIC_API_KEY is not set on the server. "
            "Configure the key, restart the API, and try again."
        )
    except Exception as exc:  # noqa: BLE001
        reply_text = f"The assistant hit an error: {exc!s}. Please retry in a moment."

    assistant_msg = MessageRecord(session_id=sid, role="assistant", content=reply_text)
    db.add(assistant_msg)
    db.commit()
    db.refresh(user_msg)
    db.refresh(assistant_msg)
    return [user_msg, assistant_msg]


@router.post("/{session_id}/assess", response_model=AssessOut)
def assess_session(session_id: UUID, payload: AssessRequest, db: Session = Depends(get_db)):
    sid = _sid(session_id)
    row = db.get(SessionRecord, sid)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    convo_parts = [payload.conversation_text]
    for m in (
        db.query(MessageRecord)
        .filter(MessageRecord.session_id == sid)
        .order_by(MessageRecord.created_at.asc())
        .all()
    ):
        convo_parts.append(f"{m.role}: {m.content}")
    conversation_text = "\n".join(convo_parts)

    symptoms = payload.symptoms.model_dump()
    result = build_assessment(row.patient, symptoms, conversation_text)

    row.symptom_snapshot = symptoms
    row.risk_score = result["risk_score"]
    row.triage_band = result["triage_band"]
    row.assessment_json = result
    db.add(row)
    db.commit()

    return AssessOut(**result)
