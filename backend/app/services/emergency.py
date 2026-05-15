import re

EMERGENCY_PHRASES = [
    r"chest\s*pain",
    r"difficulty\s*breathing",
    r"short(ness)?\s*of\s*breath",
    r"can'?t\s*breathe",
    r"unconscious",
    r"passed\s*out",
    r"severe\s*bleeding",
    r"stroke",
]


def detect_emergency_keywords(text: str) -> list[str]:
    if not text:
        return []
    lowered = text.lower()
    hits: list[str] = []
    for pattern in EMERGENCY_PHRASES:
        if re.search(pattern, lowered):
            hits.append(pattern.replace("\\s*", " "))
    return list(dict.fromkeys(hits))


def emergency_from_score(score: float) -> bool:
    return score > 75
