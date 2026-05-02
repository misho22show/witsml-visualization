"""WebSocket streaming endpoint."""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["Stream"])


def _store():  # noqa: ANN202
    from app.main import store
    return store


@router.websocket("/stream/{well_id}")
async def stream(websocket: WebSocket, well_id: str) -> None:
    await websocket.accept()
    engine = _store().get_replay(well_id)
    if engine is None:
        await websocket.send_json({"error": "Well not found"})
        await websocket.close()
        return

    try:
        while True:
            if engine.is_playing:
                payload = await engine.next_payload()
                if payload is None:
                    # Done or paused
                    await websocket.send_json({"status": "idle"})
                    await asyncio.sleep(0.2)
                    continue

                data = json.loads(payload.model_dump_json())
                await websocket.send_json(data)

                # Calculate delay based on playback speed
                speed = engine.settings.playback_speed
                base_delay = 0.1  # 100ms base interval
                await asyncio.sleep(base_delay / max(speed, 0.1))
            else:
                await asyncio.sleep(0.2)
    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close()
