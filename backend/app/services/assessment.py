from app.services.emergency import detect_emergency_keywords
from app.services.risk_model import predict_risk_score, triage_band_from_score


def _conditions_from_features(symptoms: dict) -> list[str]:
    ideas: list[str] = []
    if symptoms.get("chest_pain"):
        ideas.append("Acute coronary syndrome (rule-out in ER)")
    if symptoms.get("breathlessness"):
        ideas.append("Respiratory distress / possible infection or asthma exacerbation")
    if symptoms.get("fever"):
        ideas.append("Febrile illness (viral or bacterial — clinician evaluation)")
    if symptoms.get("nausea"):
        ideas.append("Gastroenteritis or migraine equivalent (broad differential)")
    if symptoms.get("unconscious"):
        ideas.append("Altered mental status — emergency evaluation required")
    if not ideas:
        ideas.append("Non-specific symptoms — clinician review if persistent")
    return ideas[:5]


def _first_aid(band: str) -> list[str]:
    if band == "er":
        return [
            "Call emergency services if symptoms are sudden, severe, or worsening.",
            "Stop any exertion; sit or lie in a comfortable position.",
            "Do not drive yourself to the hospital.",
        ]
    if band == "clinic":
        return [
            "Rest, hydrate, and monitor temperature and breathing.",
            "Seek same-day care if symptoms worsen or new red flags appear.",
        ]
    return [
        "Rest, fluids, and OTC relief only as appropriate for your clinician's prior advice.",
        "Self-monitor; schedule routine care if symptoms persist beyond expected recovery.",
    ]


def _next_steps(band: str) -> list[str]:
    if band == "er":
        return ["Proceed to the emergency department or call emergency services.", "Bring a list of medications and allergies."]
    if band == "clinic":
        return ["Book an urgent primary or urgent-care visit within 24-48 hours.", "Prepare a concise symptom timeline for the clinician."]
    return ["Continue home care with clear red-flag monitoring.", "Follow up with your doctor if symptoms linger or evolve."]


def build_assessment(patient: dict, symptoms: dict, conversation_text: str) -> dict:
    score, proba = predict_risk_score(
        age=int(patient.get("age", 30)),
        fever=bool(symptoms.get("fever")),
        breathlessness=bool(symptoms.get("breathlessness")),
        nausea=bool(symptoms.get("nausea")),
        chest_pain=bool(symptoms.get("chest_pain")),
        unconscious=bool(symptoms.get("unconscious")),
        duration_days=int(symptoms.get("duration_days", 1)),
        severity=int(symptoms.get("severity", 5)),
    )
    band = triage_band_from_score(score)
    kw = detect_emergency_keywords(conversation_text)
    emergency = score > 75 or bool(kw) or bool(symptoms.get("unconscious"))
    reasons = []
    if score > 75:
        reasons.append("Modelled risk score above urgent threshold")
    reasons.extend(kw)
    if symptoms.get("chest_pain"):
        reasons.append("Chest pain reported")
    if symptoms.get("breathlessness"):
        reasons.append("Breathing difficulty reported")
    if symptoms.get("unconscious"):
        reasons.append("Unconsciousness / syncope reported")

    sev = int(symptoms.get("severity", 5))
    breakdown = {
        "Pain / discomfort": min(100.0, sev * 9.0),
        "Systemic (fever)": 85.0 if symptoms.get("fever") else 15.0,
        "Respiratory": 90.0 if symptoms.get("breathlessness") else 20.0,
        "GI / nausea": 75.0 if symptoms.get("nausea") else 18.0,
        "Cardiac concern": 95.0 if symptoms.get("chest_pain") else 12.0,
    }

    return {
        "risk_score": round(score, 1),
        "triage_band": band,
        "possible_conditions": _conditions_from_features(symptoms),
        "first_aid_tips": _first_aid(band),
        "next_steps": _next_steps(band),
        "emergency": emergency,
        "emergency_reasons": list(dict.fromkeys(reasons))[:8],
        "severity_breakdown": breakdown,
    }
