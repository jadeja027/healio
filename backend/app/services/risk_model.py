from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "models"
DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "symptoms_training.csv"


def _ensure_training_data() -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DATA_PATH.exists():
        return
    rng = np.random.default_rng(42)
    n = 800
    rows = []
    for _ in range(n):
        age = int(rng.integers(5, 90))
        fever = int(rng.random() < 0.35)
        breath = int(rng.random() < 0.2)
        nausea = int(rng.random() < 0.25)
        chest = int(rng.random() < 0.12)
        unconscious = int(rng.random() < 0.02)
        duration = int(rng.integers(0, 21))
        severity = int(rng.integers(1, 11))
        risk_points = (
            severity * 4
            + duration * 1.2
            + chest * 35
            + breath * 30
            + unconscious * 80
            + fever * 8
            + nausea * 5
            + (1 if age > 65 else 0) * 6
        )
        risk_points += rng.normal(0, 6)
        risk_score = float(np.clip(risk_points, 0, 100))
        if risk_score < 40:
            triage_class = 0
        elif risk_score < 70:
            triage_class = 1
        else:
            triage_class = 2
        rows.append(
            {
                "age": age,
                "fever": fever,
                "breathlessness": breath,
                "nausea": nausea,
                "chest_pain": chest,
                "unconscious": unconscious,
                "duration_days": duration,
                "severity": severity,
                "triage_class": triage_class,
            }
        )
    pd.DataFrame(rows).to_csv(DATA_PATH, index=False)


def _train_and_save() -> RandomForestClassifier:
    _ensure_training_data()
    df = pd.read_csv(DATA_PATH)
    feature_cols = [
        "age",
        "fever",
        "breathlessness",
        "nausea",
        "chest_pain",
        "unconscious",
        "duration_days",
        "severity",
    ]
    X = df[feature_cols].values
    y = df["triage_class"].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        class_weight="balanced",
    )
    clf.fit(X_train, y_train)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": clf, "feature_cols": feature_cols}, MODEL_DIR / "risk_forest.joblib")
    return clf


def load_model():
    path = MODEL_DIR / "risk_forest.joblib"
    if not path.exists():
        _train_and_save()
    bundle = joblib.load(path)
    return bundle["model"], bundle["feature_cols"]


_model_cache = None
_feature_cols_cache = None


def get_model():
    global _model_cache, _feature_cols_cache
    if _model_cache is None:
        _model_cache, _feature_cols_cache = load_model()
    return _model_cache, _feature_cols_cache


def predict_risk_score(
    age: int,
    fever: bool,
    breathlessness: bool,
    nausea: bool,
    chest_pain: bool,
    unconscious: bool,
    duration_days: int,
    severity: int,
) -> tuple[float, np.ndarray]:
    model, feature_cols = get_model()
    row = np.array(
        [
            [
                age,
                int(fever),
                int(breathlessness),
                int(nausea),
                int(chest_pain),
                int(unconscious),
                duration_days,
                severity,
            ]
        ]
    )
    proba = model.predict_proba(row)[0]
    classes = model.classes_
    score_map = {0: 22.0, 1: 55.0, 2: 84.0}
    score = float(sum(proba[i] * score_map.get(int(classes[i]), 55.0) for i in range(len(classes))))
    score = float(np.clip(score, 0, 100))
    # Boost if hard red flags present (clinical heuristic overlay)
    if unconscious:
        score = max(score, 92.0)
    if chest_pain and breathlessness:
        score = max(score, 88.0)
    score = float(np.clip(score, 0, 100))
    return score, proba


def triage_band_from_score(score: float) -> str:
    if score < 40:
        return "home"
    if score < 70:
        return "clinic"
    return "er"
