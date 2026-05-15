"""API smoke tests (run from backend/ with: pytest tests/ -q)."""

from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app

Base.metadata.create_all(bind=engine)

client = TestClient(app)

SAMPLE_PATIENT = {
    "name": "Test User",
    "age": 34,
    "gender": "female",
    "conditions": "Seasonal allergies",
    "medications": "Loratadine as needed",
}


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_session_returns_id_and_patient():
    response = client.post("/api/sessions", json={"patient": SAMPLE_PATIENT})
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["patient"]["name"] == SAMPLE_PATIENT["name"]
    assert data["patient"]["age"] == SAMPLE_PATIENT["age"]


def test_chat_message_without_gemini_key_returns_fallback_assistant():
    created = client.post("/api/sessions", json={"patient": SAMPLE_PATIENT}).json()
    session_id = created["id"]

    response = client.post(
        f"/api/sessions/{session_id}/messages",
        json={"content": "I have had a mild headache for two days, severity 4/10."},
    )
    assert response.status_code == 200
    pair = response.json()
    assert len(pair) == 2
    roles = [m["role"] for m in pair]
    assert roles == ["user", "assistant"]
    assert len(pair[1]["content"]) > 0


def test_assess_returns_risk_and_triage_band():
    created = client.post("/api/sessions", json={"patient": SAMPLE_PATIENT}).json()
    session_id = created["id"]

    body = {
        "symptoms": {
            "fever": False,
            "breathlessness": False,
            "nausea": False,
            "chest_pain": False,
            "unconscious": False,
            "duration_days": 2,
            "severity": 4,
        },
        "conversation_text": "user: mild headache\nassistant: thanks for sharing",
    }
    response = client.post(f"/api/sessions/{session_id}/assess", json=body)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert 0 <= data["risk_score"] <= 100
    assert data["triage_band"] in ("home", "clinic", "er")
    assert isinstance(data["possible_conditions"], list)
    assert isinstance(data["emergency"], bool)
