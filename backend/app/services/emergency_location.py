"""Emergency location utilities for nearby hospitals and precautions."""

from __future__ import annotations

import math
from typing import Optional

import httpx

OVERPASS_API_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
]

EMERGENCY_PRECAUTIONS = {
    "chest_pain": {
        "title": "Chest Pain Emergency",
        "precautions": [
            "Sit upright immediately and stay calm.",
            "Loosen tight clothing around the chest and neck.",
            "Avoid physical exertion or movement.",
            "If available and not allergic, chew an aspirin.",
            "Monitor breathing and pulse if possible.",
        ],
        "severity": "CRITICAL",
    },
    "breathlessness": {
        "title": "Breathing Difficulty Emergency",
        "precautions": [
            "Sit upright in a position that eases breathing.",
            "Move to a well-ventilated area.",
            "Loosen tight clothing.",
            "Try slow, deep breathing: in 4 seconds, out 6 seconds.",
            "If you have an inhaler, use it as directed.",
        ],
        "severity": "CRITICAL",
    },
    "severe_bleeding": {
        "title": "Severe Bleeding Emergency",
        "precautions": [
            "Apply firm, continuous pressure with a clean cloth.",
            "Elevate the injured area above heart level if possible.",
            "Do not remove the first cloth; add layers if needed.",
            "Immobilize the injured area to prevent movement.",
            "Keep the person warm and still.",
        ],
        "severity": "CRITICAL",
    },
    "stroke": {
        "title": "Stroke Emergency (F.A.S.T.)",
        "precautions": [
            "Face: check for drooping.",
            "Arms: check if one arm drifts downward.",
            "Speech: listen for slurred speech.",
            "Time: note when symptoms started.",
            "Keep the person calm and do not give food or drink.",
        ],
        "severity": "CRITICAL",
    },
    "unconscious": {
        "title": "Unconsciousness Emergency",
        "precautions": [
            "Check responsiveness and breathing.",
            "Call emergency services immediately.",
            "Place in recovery position if possible.",
            "Tilt head slightly back to open airway.",
            "Do not move the person unless in danger.",
        ],
        "severity": "CRITICAL",
    },
    "general_emergency": {
        "title": "Medical Emergency",
        "precautions": [
            "Call emergency services immediately.",
            "Do not move the person unless in immediate danger.",
            "Keep the area safe and clear.",
            "Provide comfort and reassurance.",
            "Monitor breathing and consciousness if trained.",
        ],
        "severity": "HIGH",
    },
}


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance in kilometers using the Haversine formula."""
    radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return radius_km * c


async def fetch_nearby_hospitals(latitude: float, longitude: float, radius_km: float = 10.0) -> dict:
    """Fetch nearby hospitals from Overpass API and rank them."""
    radius_m = int(radius_km * 1000)
    overpass_query = f"""
    [out:json][timeout:25];
    (
        node["amenity"="hospital"](around:{radius_m},{latitude},{longitude});
        way["amenity"="hospital"](around:{radius_m},{latitude},{longitude});
        relation["amenity"="hospital"](around:{radius_m},{latitude},{longitude});
    );
    out center;
    """

    try:
        data = None
        last_error = None
        async with httpx.AsyncClient(timeout=18.0, follow_redirects=True) as client:
            for url in OVERPASS_API_URLS:
                try:
                    response = await client.post(
                        url,
                        data=overpass_query,
                        headers={"User-Agent": "Healio-Triage-System/1.0"},
                    )
                    response.raise_for_status()
                    content_type = response.headers.get("content-type", "")
                    body_text = response.text or ""
                    if "json" not in content_type.lower():
                        last_error = f"Overpass non-JSON response from {url}: {body_text[:200]}"
                        continue
                    if not body_text.strip():
                        last_error = f"Overpass empty response from {url}"
                        continue
                    try:
                        data = response.json()
                        break
                    except ValueError as exc:
                        last_error = f"Invalid JSON from {url}: {exc}"
                        continue
                except httpx.TimeoutException as exc:
                    last_error = f"Overpass timeout from {url}: {exc}"
                    continue
                except httpx.HTTPError as exc:
                    last_error = f"Overpass error from {url}: {exc}"
                    continue

        if data is None:
            return {
                "success": False,
                "error": last_error or "Overpass API returned no data.",
                "hospitals": [],
                "count": 0,
            }
        hospitals: list[dict] = []

        for element in data.get("elements", []):
            tags = element.get("tags", {})
            if tags.get("amenity") != "hospital":
                continue

            if element.get("type") == "node":
                lat = element.get("lat")
                lon = element.get("lon")
            else:
                center = element.get("center") or {}
                lat = center.get("lat")
                lon = center.get("lon")

            if lat is None or lon is None:
                continue

            distance_km = calculate_distance_km(latitude, longitude, lat, lon)
            emergency_tag = (tags.get("emergency") or "unknown").lower()

            score = 80.0
            if emergency_tag == "yes":
                score = 100.0
            elif emergency_tag == "no":
                score = 50.0

            distance_penalty = min((distance_km / radius_km) * 25.0, 25.0)
            score = max(0.0, score - distance_penalty)

            hospitals.append(
                {
                    "id": str(element.get("id")),
                    "name": tags.get("name", "Unknown Hospital"),
                    "latitude": lat,
                    "longitude": lon,
                    "distance_km": round(distance_km, 2),
                    "emergency_score": round(score, 1),
                    "emergency": emergency_tag,
                    "phone": tags.get("phone", ""),
                    "website": tags.get("website", ""),
                    "operator": tags.get("operator", ""),
                }
            )

        hospitals.sort(key=lambda h: (-h["emergency_score"], h["distance_km"]))

        return {
            "success": True,
            "user_location": {"latitude": latitude, "longitude": longitude},
            "hospitals": hospitals[:20],
            "count": len(hospitals),
        }
    except httpx.HTTPError as exc:
        return {
            "success": False,
            "error": f"Failed to fetch hospitals: {exc}",
            "hospitals": [],
            "count": 0,
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "success": False,
            "error": f"Failed to process hospital data: {exc}",
            "hospitals": [],
            "count": 0,
        }


def get_emergency_precautions(symptom_keyword: Optional[str] = None) -> dict:
    """Return emergency precautions for a symptom keyword."""
    if symptom_keyword:
        keyword = symptom_keyword.lower()
        for key, details in EMERGENCY_PRECAUTIONS.items():
            if key in keyword or keyword in key:
                return {"success": True, "precautions": details}

    return {"success": True, "precautions": EMERGENCY_PRECAUTIONS["general_emergency"]}


def get_all_emergency_precautions() -> dict:
    """Return all available emergency precautions."""
    return {"success": True, "precautions": EMERGENCY_PRECAUTIONS}
