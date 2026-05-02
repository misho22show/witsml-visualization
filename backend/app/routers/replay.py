"""Replay control and data query endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    BroomstickBin,
    DetectionSettings,
)

router = APIRouter(tags=["Replay"])


def _store():  # noqa: ANN202
    from app.main import store
    return store


@router.post("/replay/start")
async def replay_start(well_id: str) -> dict:
    engine = _store().get_replay(well_id)
    if engine is None:
        raise HTTPException(404, "Well not found")
    await engine.start()
    return {"status": "playing", "well_id": well_id}


@router.post("/replay/pause")
async def replay_pause(well_id: str) -> dict:
    engine = _store().get_replay(well_id)
    if engine is None:
        raise HTTPException(404, "Well not found")
    await engine.pause()
    return {"status": "paused", "well_id": well_id}


@router.post("/replay/reset")
async def replay_reset(well_id: str) -> dict:
    engine = _store().reset_replay(well_id)
    if engine is None:
        raise HTTPException(404, "Well not found")
    return {"status": "reset", "well_id": well_id}


@router.get("/broomstick/{well_id}", response_model=list[BroomstickBin])
def get_broomstick(well_id: str) -> list[BroomstickBin]:
    engine = _store().get_replay(well_id)
    if engine is None:
        raise HTTPException(404, "Well not found")
    return engine.broomstick.get_bins()


@router.get("/surge-swab/{well_id}")
def get_surge_swab(well_id: str) -> list[dict]:
    engine = _store().get_replay(well_id)
    if engine is None:
        raise HTTPException(404, "Well not found")
    return engine.surge_events


@router.get("/states/{well_id}")
def get_states(well_id: str) -> list[dict]:
    engine = _store().get_replay(well_id)
    if engine is None:
        raise HTTPException(404, "Well not found")
    return engine.rig_states


@router.get("/events/{well_id}")
def get_events(well_id: str) -> list[dict]:
    engine = _store().get_replay(well_id)
    if engine is None:
        raise HTTPException(404, "Well not found")
    return engine.all_events


@router.post("/settings/detection")
def update_settings(settings: DetectionSettings) -> dict:
    s = _store()
    s.settings = settings
    for engine in s.replays.values():
        engine.update_settings(settings)
    return {"status": "updated", "settings": settings.model_dump()}
