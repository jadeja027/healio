"""Emergency assistance endpoints."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.services.emergency_location import (
    fetch_nearby_hospitals,
    get_all_emergency_precautions,
    get_emergency_precautions,
)

router = APIRouter(prefix="/api/emergency", tags=["emergency"])


class LocationInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=15.0, ge=1, le=50)


class HospitalData(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    distance_km: float
    emergency_score: float
    emergency: str
    phone: str
    website: str
    operator: str


class NearbyHospitalsResponse(BaseModel):
    success: bool
    user_location: Optional[dict] = None
    hospitals: List[HospitalData] = []
    count: int
    error: Optional[str] = None


class EmergencyPrecautionsData(BaseModel):
    title: str
    precautions: List[str]
    severity: str


class EmergencyPrecautionsResponse(BaseModel):
    success: bool
    precautions: EmergencyPrecautionsData


@router.post("/nearby-hospitals", response_model=NearbyHospitalsResponse)
async def get_nearby_hospitals(location: LocationInput):
    result = await fetch_nearby_hospitals(
        latitude=location.latitude,
        longitude=location.longitude,
        radius_km=location.radius_km,
    )

    if result.get("success"):
        return NearbyHospitalsResponse(
            success=True,
            user_location=result.get("user_location"),
            hospitals=result.get("hospitals", []),
            count=result.get("count", 0),
        )

    return NearbyHospitalsResponse(
        success=False,
        hospitals=[],
        count=0,
        error=result.get("error", "Unknown error"),
    )


@router.get("/precautions", response_model=EmergencyPrecautionsResponse)
def get_precautions(symptom: Optional[str] = Query(None)):
    result = get_emergency_precautions(symptom_keyword=symptom)
    data = result["precautions"]
    return EmergencyPrecautionsResponse(
        success=result["success"],
        precautions=EmergencyPrecautionsData(
            title=data["title"],
            precautions=data["precautions"],
            severity=data["severity"],
        ),
    )


@router.get("/precautions/all")
def get_all_precautions():
    return get_all_emergency_precautions()
