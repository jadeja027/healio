from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _new_uuid_str() -> str:
    return str(uuid.uuid4())


class SessionRecord(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid_str)
    patient: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    symptom_snapshot: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    triage_band: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    assessment_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    messages: Mapped[list["MessageRecord"]] = relationship(
        "MessageRecord", back_populates="session", cascade="all, delete-orphan"
    )


class MessageRecord(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid_str)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sessions.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    session: Mapped["SessionRecord"] = relationship("SessionRecord", back_populates="messages")
