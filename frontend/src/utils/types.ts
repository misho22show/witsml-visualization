export interface WitsmlRecord {
  time: number;
  measured_depth: number | null;
  block_position: number | null;
  hookload: number | null;
  surface_torque: number | null;
  rpm: number | null;
  flow_rate: number | null;
  standpipe_pressure: number | null;
  annular_pressure: number | null;
  ecd: number | null;
  rop: number | null;
}

export interface RigStateRecord {
  time: number;
  depth: number | null;
  state: string;
  confidence: string;
}

export interface SurgeSwabEvent {
  time: number;
  depth: number | null;
  condition: string;
  pressure_deviation: number;
  movement_rate: number;
  severity: number;
  confidence: string;
}

export interface DetectedEvent {
  time: number;
  depth: number | null;
  event_type: string;
  confidence: string;
}

export interface FeatureQuality {
  feature: string;
  confidence: string;
  available_channels: string[];
  missing_channels: string[];
  notes: string;
}

export interface StreamPayload {
  record: WitsmlRecord;
  rig_state: RigStateRecord;
  surge_swab: SurgeSwabEvent | null;
  events: DetectedEvent[];
  quality: FeatureQuality[];
  replay_index: number;
  total_records: number;
}

export interface BroomstickBin {
  depth_bin: number;
  pickup_hookload: number | null;
  slackoff_hookload: number | null;
  rotation_hookload: number | null;
  rotation_torque: number | null;
  sample_count: number;
}

export interface WellInfo {
  id: string;
  name: string;
  channels: { name: string; unit: string; available: boolean; quality: string }[];
  record_count: number;
}

export interface DetectionSettings {
  rpm_threshold: number;
  depth_delta_threshold: number;
  flow_threshold: number;
  pressure_baseline_window: number;
  pressure_deviation_threshold: number;
  hookload_tag_threshold: number;
  playback_speed: number;
}
