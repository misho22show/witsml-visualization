"""Replay engine – streams WITSML records via WebSocket at configurable speed."""

from __future__ import annotations

import asyncio
from typing import Optional

from app.detectors.broomstick import BroomstickAggregator
from app.detectors.data_quality import evaluate_quality
from app.detectors.events import EventDetector
from app.detectors.rig_state import RigStateClassifier
from app.detectors.surge_swab import SurgeSwabDetector
from app.models.schemas import (
    DetectionSettings,
    StreamPayload,
    WitsmlRecord,
)


class ReplayEngine:
    """Manages replay state for a single well."""

    def __init__(
        self,
        records: list[WitsmlRecord],
        settings: DetectionSettings,
    ) -> None:
        self.records = records
        self.settings = settings

        self._index = 0
        self._playing = False
        self._lock = asyncio.Lock()

        # Processors
        self.state_classifier = RigStateClassifier(settings)
        self.surge_detector = SurgeSwabDetector(settings)
        self.event_detector = EventDetector(settings)
        self.broomstick = BroomstickAggregator()

        # Accumulated results
        self.rig_states: list[dict] = []
        self.surge_events: list[dict] = []
        self.all_events: list[dict] = []
        self._prev_depth: float | None = None
        self._prev_time: float | None = None

    @property
    def is_playing(self) -> bool:
        return self._playing

    @property
    def current_index(self) -> int:
        return self._index

    async def start(self) -> None:
        async with self._lock:
            self._playing = True

    async def pause(self) -> None:
        async with self._lock:
            self._playing = False

    async def reset(self) -> None:
        async with self._lock:
            self._playing = False
            self._index = 0
            self.state_classifier = RigStateClassifier(self.settings)
            self.surge_detector = SurgeSwabDetector(self.settings)
            self.event_detector = EventDetector(self.settings)
            self.broomstick = BroomstickAggregator()
            self.rig_states.clear()
            self.surge_events.clear()
            self.all_events.clear()
            self._prev_depth = None
            self._prev_time = None

    def update_settings(self, settings: DetectionSettings) -> None:
        self.settings = settings
        self.state_classifier.update_settings(settings)
        self.surge_detector.update_settings(settings)
        self.event_detector.update_settings(settings)

    async def next_payload(self) -> Optional[StreamPayload]:
        """Process the next record and return a StreamPayload, or None if done/paused."""
        async with self._lock:
            if not self._playing or self._index >= len(self.records):
                return None
            rec = self.records[self._index]
            self._index += 1

        # Compute ROP (ft/hr) from depth change over time change
        cur_depth = rec.measured_depth if rec.measured_depth is not None else rec.block_position
        rop: float | None = None
        if cur_depth is not None and self._prev_depth is not None and self._prev_time is not None:
            dt = rec.time - self._prev_time
            if dt > 0:
                delta_depth = cur_depth - self._prev_depth
                rop = max((delta_depth / dt) * 3600 * 3.28084, 0.0)  # m/s -> ft/hr
        self._prev_depth = cur_depth
        self._prev_time = rec.time
        rec = rec.model_copy(update={"rop": rop})

        # Process
        rig_state = self.state_classifier.classify(rec)
        surge_swab = self.surge_detector.evaluate(rec)
        events = self.event_detector.detect(rec)
        quality = evaluate_quality(rec)
        self.broomstick.add(rec, rig_state.state)

        # Accumulate
        self.rig_states.append(rig_state.model_dump())
        if surge_swab.condition.value not in ("Neutral", "Unclassified"):
            self.surge_events.append(surge_swab.model_dump())
        for e in events:
            self.all_events.append(e.model_dump())

        return StreamPayload(
            record=rec,
            rig_state=rig_state,
            surge_swab=surge_swab,
            events=events,
            quality=quality,
            replay_index=self._index,
            total_records=len(self.records),
        )
