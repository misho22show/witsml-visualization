"""Well listing and channel endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import ChannelInfo, WellInfo

router = APIRouter(tags=["Wells"])


def _store():  # noqa: ANN202
    from app.main import store
    return store


@router.get("/wells", response_model=list[WellInfo])
def list_wells() -> list[WellInfo]:
    return list(_store().wells.values())


@router.get("/wells/{well_id}/channels", response_model=list[ChannelInfo])
def get_channels(well_id: str) -> list[ChannelInfo]:
    well = _store().wells.get(well_id)
    if well is None:
        raise HTTPException(404, f"Well '{well_id}' not found")
    return well.channels
