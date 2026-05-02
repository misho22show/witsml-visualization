"""Compute per-feature data-quality / confidence scores."""

from __future__ import annotations

from app.models.schemas import ConfidenceLevel, FeatureQuality, WitsmlRecord


_FEATURE_DEPS: dict[str, list[str]] = {
    "Broomstick": ["hookload", "measured_depth"],
    "Rig State": ["measured_depth", "rpm", "flow_rate"],
    "Surge/Swab": ["standpipe_pressure", "measured_depth"],
}


def evaluate_quality(rec: WitsmlRecord) -> list[FeatureQuality]:
    results: list[FeatureQuality] = []
    rec_dict = rec.model_dump()

    for feature, required in _FEATURE_DEPS.items():
        available: list[str] = []
        missing: list[str] = []
        for ch in required:
            if rec_dict.get(ch) is not None:
                available.append(ch)
            else:
                missing.append(ch)

        ratio = len(available) / len(required) if required else 1.0
        if ratio >= 1.0:
            confidence = ConfidenceLevel.HIGH
        elif ratio >= 0.5:
            confidence = ConfidenceLevel.MEDIUM
        else:
            confidence = ConfidenceLevel.LOW

        notes = ""
        if missing:
            notes = f"Missing channels: {', '.join(missing)}"

        results.append(
            FeatureQuality(
                feature=feature,
                confidence=confidence,
                available_channels=available,
                missing_channels=missing,
                notes=notes,
            )
        )
    return results
