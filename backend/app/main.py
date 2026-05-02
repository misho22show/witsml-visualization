"""FastAPI application entry-point."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.engines.store import DataStore
from app.routers import replay, stream, wells

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

store = DataStore()

app = FastAPI(
    title="WITSML Visualization API",
    version="0.1.0",
    description="Real-Time Broomstick and Surge/Swab Visualization from WITSML Data",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wells.router)
app.include_router(replay.router)
app.include_router(stream.router)


@app.on_event("startup")
def startup() -> None:
    store.load_directory(DATA_DIR)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "wells_loaded": len(store.wells)}
