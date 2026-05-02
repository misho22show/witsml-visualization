"""Detect operational events from WITSML channel transitions."""

from __future__ import annotations

from typing import Optional

from app.models.schemas import (
    ConfidenceLevel,
    DetectedEvent,
    DetectionSettings,
    EventType,
    WitsmlRecord,
)


class EventDetector:
    def __init__(self, settings: DetectionSettings) -> None:
        self.settings = settings
        self._prev: Optional[WitsmlRecord] = None

    def update_settings(self, settings: DetectionSettings) -> None:
        self.settings = settings

    def detect(self, rec: WitsmlRecord) -> list[DetectedEvent]:
        events: list[DetectedEvent] = []
        prev = self._prev
        self._prev = rec

        if prev is None:
            return events

        s = self.settings
        depth = rec.measured_depth if rec.measured_depth is not None else rec.block_position

        # Pump start / stop
        prev_flow = prev.flow_rate or 0.0
        curr_flow = rec.flow_rate or 0.0
        if prev_flow < s.flow_threshold <= curr_flow:
            events.append(
                DetectedEvent(time=rec.time, depth=depth, event_type=EventType.PUMP_START)
            )
        elif prev_flow >= s.flow_threshold > curr_flow:
            events.append(
                DetectedEvent(time=rec.time, depth=depth, event_type=EventType.PUMP_STOP)
            )

        # Rotation start / stop
        prev_rpm = prev.rpm or 0.0
        curr_rpm = rec.rpm or 0.0
        if prev_rpm < s.rpm_threshold <= curr_rpm:
            events.append(
                DetectedEvent(time=rec.time, depth=depth, event_type=EventType.ROTATION_START)
            )
        elif prev_rpm >= s.rpm_threshold > curr_rpm:
            events.append(
                DetectedEvent(time=rec.time, depth=depth, event_type=EventType.ROTATION_STOP)
            )

        # Tag bottom
        prev_hl = prev.hookload or 0.0
        curr_hl = rec.hookload or 0.0
        prev_depth = prev.measured_depth or prev.block_position or 0.0
        curr_depth = rec.measured_depth or rec.block_position or 0.0
        hl_change = abs(curr_hl - prev_hl)
        depth_stopped = abs(curr_depth - prev_depth) < s.depth_delta_threshold
        if hl_change > s.hookload_tag_threshold and depth_stopped:
            events.append(
                DetectedEvent(
                    time=rec.time,
                    depth=depth,
                    event_type=EventType.TAG_BOTTOM,
                    confidence=ConfidenceLevel.MEDIUM,
                )
            )

        # Connection: RPM off + flow off + depth static
        if (
            curr_rpm < s.rpm_threshold
            and curr_flow < s.flow_threshold
            and depth_stopped
            and (prev_rpm >= s.rpm_threshold or prev_flow >= s.flow_threshold)
        ):
            events.append(
                DetectedEvent(
                    time=rec.time,
                    depth=depth,
                    event_type=EventType.CONNECTION,
                    confidence=ConfidenceLevel.MEDIUM,
                )
            )

        return events
