import os
import httpx
from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter(prefix="/places", tags=["Places"])


@router.get("/autocomplete")
async def autocomplete(input: str, sessiontoken: str = ""):
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="Google Maps API key not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://places.googleapis.com/v1/places:autocomplete",
            json={
                "input": input,
                "includedRegionCodes": ["nz"],
                "languageCode": "en",
            },
            headers={
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": "suggestions.placePrediction.text,suggestions.placePrediction.placeId",
            },
            timeout=5.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Places API error")

    data = resp.json()
    suggestions = data.get("suggestions", [])
    return {
        "predictions": [
            {
                "description": s.get("placePrediction", {}).get("text", {}).get("text", ""),
                "place_id": s.get("placePrediction", {}).get("placeId", ""),
            }
            for s in suggestions
        ]
    }


@router.get("/test")
async def test_places():
    api_key = settings.GOOGLE_MAPS_API_KEY
    return {"configured": bool(api_key)}
