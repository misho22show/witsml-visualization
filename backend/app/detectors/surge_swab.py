"""Data-driven surge/swab detection from WITSML pressure and depth."""

from __future__ import annotations

from collections import deque
from typing import Optional

from app.models.schemas import (
    ConfidenceLevel,
    DetectionSettings,
    SurgeSwabCondition,
    SurgeSwabEvent,
    WitsmlRecord,
)


class SurgeSwabDetector:
    def __init__(self, settings: DetectionSettings) -> None:
        self.settings = settings
        self._prev_depth: Optional[float] = None
        self._prev_time: Optional[float] = None
        self._pressure_window: deque[float] = deque(maxlen=settings.pressure_baseline_window)

    def update_settings(self, settings: DetectionSettings) -> None:
        self.settings = settings
        self._pressure_window = deque(
            self._pressure_window,
            maxlen=settings.pressure_baseline_window,
        )

    def evaluate(self, rec: WitsmlRecord) -> SurgeSwabEvent:
        depth = rec.measured_depth if rec.measured_depth is not None else rec.block_position
        pressure = (
            rec.standpipe_pressure
            if rec.standpipe_pressure is not None
            else (rec.annular_pressure if rec.annular_pressure is not None else rec.ecd)
        )

        # Channel availability
        has_depth = depth is not None
        has_pressure = pressure is not None

        if not has_depth or not has_pressure:
            return SurgeSwabEvent(
                time=rec.time,
                depth=depth,
                condition=SurgeSwabCondition.UNCLASSIFIED,
                confidence=ConfidenceLevel.LOW,
            )

        # Movement direction and rate
        depth_delta: float = 0.0
        dt: float = 1.0
        if self._prev_depth is not None:
            depth_delta = depth - self._prev_depth  # type: ignore[operator]
        if self._prev_time is not None:
            dt = max(rec.time - self._prev_time, 0.001)
        self._prev_depth = depth
        self._prev_time = rec.time

        movement_rate = depth_delta / dt

        # Pressure baseline
        self._pressure_window.append(pressure)  # type: ignore[arg-type]
        if len(self._pressure_window) < 3:
            return SurgeSwabEvent(
                time=rec.time,
                depth=depth,
                condition=SurgeSwabCondition.NEUTRAL,
                movement_rate=movement_rate,
                confidence=ConfidenceLevel.MEDIUM,
            )

        baseline = sum(self._pressure_window) / len(self._pressure_window)
        deviation = pressure - baseline  # type: ignore[operator]

        # Classification
        s = self.settings
        moving_in = depth_delta > s.depth_delta_threshold
        moving_out = depth_delta < -s.depth_delta_threshold

        condition = SurgeSwabCondition.NEUTRAL
        if moving_in and deviation > s.pressure_deviation_threshold:
            condition = SurgeSwabCondition.SURGE
        elif moving_out and deviation < -s.pressure_deviation_threshold:
            condition = SurgeSwabCondition.SWAB

        severity = abs(deviation) * abs(movement_rate)

        # Confidence
        window_fill = len(self._pressure_window) / self._pressure_window.maxlen  # type: ignore[operator]
        confidence = (
            ConfidenceLevel.HIGH
            if window_fill > 0.8 and has_depth and has_pressure
            else ConfidenceLevel.MEDIUM
            if window_fill > 0.4
            else ConfidenceLevel.LOW
        )

        return SurgeSwabEvent(
            time=rec.time,
            depth=depth,
            condition=condition,
            pressure_deviation=round(deviation, 2),
            movement_rate=round(movement_rate, 4),
            severity=round(severity, 2),
            confidence=confidence,
        )
