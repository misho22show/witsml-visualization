"""Generate depth-binned broomstick aggregation (pickup/slack-off/rotation)."""

from __future__ import annotations

from collections import defaultdict
from typing import Optional

import numpy as np

from app.models.schemas import BroomstickBin, RigState, WitsmlRecord


class BroomstickAggregator:
    def __init__(self, bin_size: float = 5.0) -> None:
        self.bin_size = bin_size
        self._bins: dict[float, dict[str, list[float]]] = defaultdict(
            lambda: {
                "pickup_hl": [],
                "slackoff_hl": [],
                "rotation_hl": [],
                "rotation_torque": [],
            }
        )
        self._prev_depth: Optional[float] = None

    def add(self, rec: WitsmlRecord, state: RigState) -> None:
        depth = rec.measured_depth if rec.measured_depth is not None else rec.block_position
        if depth is None or rec.hookload is None:
            return

        bin_key = round(depth / self.bin_size) * self.bin_size

        depth_delta = 0.0
        if self._prev_depth is not None:
            depth_delta = depth - self._prev_depth
        self._prev_depth = depth

        # Classify hookload into pickup / slack-off / rotation
        if depth_delta < -0.01:
            # Pulling up => pickup
            self._bins[bin_key]["pickup_hl"].append(rec.hookload)
        elif depth_delta > 0.01:
            # Going down => slack-off
            self._bins[bin_key]["slackoff_hl"].append(rec.hookload)

        if state in (RigState.DRILLING, RigState.ROTATING_OFF_BOTTOM, RigState.REAMING):
            self._bins[bin_key]["rotation_hl"].append(rec.hookload)
            if rec.surface_torque is not None:
                self._bins[bin_key]["rotation_torque"].append(rec.surface_torque)

    def get_bins(self) -> list[BroomstickBin]:
        result: list[BroomstickBin] = []
        for depth_bin in sorted(self._bins.keys()):
            data = self._bins[depth_bin]
            count = (
                len(data["pickup_hl"])
                + len(data["slackoff_hl"])
                + len(data["rotation_hl"])
            )
            result.append(
                BroomstickBin(
                    depth_bin=depth_bin,
                    pickup_hookload=float(np.mean(data["pickup_hl"])) if data["pickup_hl"] else None,
                    slackoff_hookload=float(np.mean(data["slackoff_hl"])) if data["slackoff_hl"] else None,
                    rotation_hookload=float(np.mean(data["rotation_hl"])) if data["rotation_hl"] else None,
                    rotation_torque=float(np.mean(data["rotation_torque"])) if data["rotation_torque"] else None,
                    sample_count=count,
                )
            )
        return result
