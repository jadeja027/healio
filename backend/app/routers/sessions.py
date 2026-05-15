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


def _body_map_context(body_map) -> str:
    if not body_map:
        return ""
    areas = body_map.body_areas or []
    if not areas:
        return ""
    parts = ", ".join(areas)
    pain = body_map.pain_level
    return f"Body map selection: {parts}. Pain level {pain}/10."


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
        body_context = _body_map_context(payload.body_map)
        llm_input = payload.content
        if body_context:
            llm_input = f"{body_context}\n\nUser message: {payload.content}"
        reply_text = generate_assistant_reply(history, llm_input)
    except ValueError:
        reply_text = (
            "Healio triage chat is offline because GEMINI_API_KEY (or GOOGLE_API_KEY) is not set on the server. "
            "Add your Google AI Studio key to .env, restart the API, and try again."
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
    if payload.body_map and payload.body_map.summary:
        convo_parts.append(f"body_map: {payload.body_map.summary}")
    for m in (
        db.query(MessageRecord)
        .filter(MessageRecord.session_id == sid)
        .order_by(MessageRecord.created_at.asc())
        .all()
    ):
        convo_parts.append(f"{m.role}: {m.content}")
    conversation_text = "\n".join(convo_parts)

    symptoms = payload.symptoms.model_dump()
    body_map = payload.body_map.model_dump() if payload.body_map else None
    result = build_assessment(row.patient, symptoms, conversation_text, body_map=body_map)

    row.symptom_snapshot = symptoms
    row.risk_score = result["risk_score"]
    row.triage_band = result["triage_band"]
    row.assessment_json = result
    db.add(row)
    db.commit()

    return AssessOut(**result)
