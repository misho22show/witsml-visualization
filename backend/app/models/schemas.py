from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class RigState(str, Enum):
    DRILLING = "Drilling"
    ROTATING_OFF_BOTTOM = "Rotating Off-Bottom"
    SLIDING = "Sliding"
    RIH = "RIH"
    POOH = "POOH"
    STATIC = "Static / Connection"
    REAMING = "Reaming"
    UNKNOWN = "Unknown"


class ConfidenceLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class SurgeSwabCondition(str, Enum):
    SURGE = "Surge"
    SWAB = "Swab"
    NEUTRAL = "Neutral"
    UNCLASSIFIED = "Unclassified"


class EventType(str, Enum):
    PUMP_START = "Pump Start"
    PUMP_STOP = "Pump Stop"
    ROTATION_START = "Rotation Start"
    ROTATION_STOP = "Rotation Stop"
    TAG_BOTTOM = "Tag Bottom"
    CONNECTION = "Connection"


# ---------------------------------------------------------------------------
# Detection thresholds (configurable)
# ---------------------------------------------------------------------------

class DetectionSettings(BaseModel):
    rpm_threshold: float = Field(5.0, description="RPM above this => rotating")
    depth_delta_threshold: float = Field(0.05, description="Depth change per sample for movement")
    flow_threshold: float = Field(10.0, description="Flow rate above this => pumps on")
    pressure_baseline_window: int = Field(20, description="Rolling window size for pressure baseline")
    pressure_deviation_threshold: float = Field(50.0, description="Pressure deviation for surge/swab")
    hookload_tag_threshold: float = Field(5.0, description="Hookload change for tag-bottom detection")
    playback_speed: float = Field(1.0, description="Replay speed multiplier")


# ---------------------------------------------------------------------------
# Data records
# ---------------------------------------------------------------------------

class WitsmlRecord(BaseModel):
    time: float
    measured_depth: Optional[float] = None
    block_position: Optional[float] = None
    hookload: Optional[float] = None
    surface_torque: Optional[float] = None
    rpm: Optional[float] = None
    flow_rate: Optional[float] = None
    standpipe_pressure: Optional[float] = None
    annular_pressure: Optional[float] = None
    ecd: Optional[float] = None
    rop: Optional[float] = None


class ChannelInfo(BaseModel):
    name: str
    unit: str
    available: bool = True
    quality: ConfidenceLevel = ConfidenceLevel.HIGH


class WellInfo(BaseModel):
    id: str
    name: str
    channels: list[ChannelInfo] = []
    record_count: int = 0


# ---------------------------------------------------------------------------
# Rig-state result
# ---------------------------------------------------------------------------

class RigStateRecord(BaseModel):
    time: float
    depth: Optional[float] = None
    state: RigState
    confidence: ConfidenceLevel


# ---------------------------------------------------------------------------
# Broomstick
# ---------------------------------------------------------------------------

class BroomstickBin(BaseModel):
    depth_bin: float
    pickup_hookload: Optional[float] = None
    slackoff_hookload: Optional[float] = None
    rotation_hookload: Optional[float] = None
    rotation_torque: Optional[float] = None
    sample_count: int = 0


# ---------------------------------------------------------------------------
# Surge / Swab
# ---------------------------------------------------------------------------

class SurgeSwabEvent(BaseModel):
    time: float
    depth: Optional[float] = None
    condition: SurgeSwabCondition
    pressure_deviation: float = 0.0
    movement_rate: float = 0.0
    severity: float = 0.0
    confidence: ConfidenceLevel = ConfidenceLevel.LOW


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

class DetectedEvent(BaseModel):
    time: float
    depth: Optional[float] = None
    event_type: EventType
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM


# ---------------------------------------------------------------------------
# Data quality
# ---------------------------------------------------------------------------

class FeatureQuality(BaseModel):
    feature: str
    confidence: ConfidenceLevel
    available_channels: list[str]
    missing_channels: list[str]
    notes: str = ""


# ---------------------------------------------------------------------------
# Stream payload
# ---------------------------------------------------------------------------

class StreamPayload(BaseModel):
    record: WitsmlRecord
    rig_state: RigStateRecord
    surge_swab: Optional[SurgeSwabEvent] = None
    events: list[DetectedEvent] = []
    quality: list[FeatureQuality] = []
    replay_index: int = 0
    total_records: int = 0
