from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PatientOnboarding(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    age: int = Field(..., ge=0, le=120)
    gender: Literal["female", "male", "other", "prefer_not_say"]
    conditions: str = Field(default="", max_length=2000)
    medications: str = Field(default="", max_length=2000)


class SessionCreate(BaseModel):
    patient: PatientOnboarding


class SessionOut(BaseModel):
    id: UUID
    patient: Dict[str, Any]
    created_at: datetime
    risk_score: Optional[float] = None
    triage_band: Optional[str] = None
    assessment_json: Optional[Dict[str, Any]] = None
    symptom_snapshot: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class MessageIn(BaseModel):
    content: str = Field(..., min_length=1, max_length=8000)


class MessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class SymptomFeatures(BaseModel):
    fever: bool = False
    breathlessness: bool = False
    nausea: bool = False
    chest_pain: bool = False
    unconscious: bool = False
    duration_days: int = Field(default=1, ge=0, le=365)
    severity: int = Field(default=5, ge=1, le=10)


class AssessRequest(BaseModel):
    symptoms: SymptomFeatures
    conversation_text: str = ""


class AssessOut(BaseModel):
    risk_score: float
    triage_band: Literal["home", "clinic", "er"]
    possible_conditions: List[str]
    first_aid_tips: List[str]
    next_steps: List[str]
    emergency: bool
    emergency_reasons: List[str]
    severity_breakdown: Dict[str, float]
