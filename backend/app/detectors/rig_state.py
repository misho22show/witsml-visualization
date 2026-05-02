"""Threshold-based rig-state classifier."""

from __future__ import annotations

from typing import Optional

from app.models.schemas import (
    ConfidenceLevel,
    DetectionSettings,
    RigState,
    RigStateRecord,
    WitsmlRecord,
)


class RigStateClassifier:
    def __init__(self, settings: DetectionSettings) -> None:
        self.settings = settings
        self._prev_depth: Optional[float] = None

    def update_settings(self, settings: DetectionSettings) -> None:
        self.settings = settings

    def classify(self, rec: WitsmlRecord) -> RigStateRecord:
        s = self.settings
        depth = rec.measured_depth if rec.measured_depth is not None else rec.block_position

        # Determine depth delta
        depth_delta: float = 0.0
        if depth is not None and self._prev_depth is not None:
            depth_delta = depth - self._prev_depth
        if depth is not None:
            self._prev_depth = depth

        rpm = rec.rpm if rec.rpm is not None else 0.0
        flow = rec.flow_rate if rec.flow_rate is not None else 0.0
        depth_increasing = depth_delta > s.depth_delta_threshold
        depth_decreasing = depth_delta < -s.depth_delta_threshold
        depth_changing = abs(depth_delta) > s.depth_delta_threshold
        rotating = rpm > s.rpm_threshold
        pumping = flow > s.flow_threshold

        # Confidence based on channel availability
        available_count = sum(
            1 for v in [depth, rec.rpm, rec.flow_rate] if v is not None
        )
        confidence = (
            ConfidenceLevel.HIGH
            if available_count == 3
            else ConfidenceLevel.MEDIUM
            if available_count == 2
            else ConfidenceLevel.LOW
        )

        # Classification logic
        state = RigState.UNKNOWN

        if depth_increasing and rotating and pumping:
            state = RigState.DRILLING
        elif depth_increasing and not rotating and pumping:
            state = RigState.SLIDING
        elif depth_increasing and not pumping:
            state = RigState.RIH
        elif depth_decreasing:
            state = RigState.POOH
        elif rotating and not depth_changing and pumping:
            state = RigState.ROTATING_OFF_BOTTOM
        elif depth_changing and rotating:
            state = RigState.REAMING
        elif not depth_changing and not rotating and not pumping:
            state = RigState.STATIC

        return RigStateRecord(
            time=rec.time,
            depth=depth,
            state=state,
            confidence=confidence,
        )
