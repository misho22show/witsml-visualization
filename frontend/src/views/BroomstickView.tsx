import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StreamPayload } from "../utils/types";

interface Props {
  history: StreamPayload[];
}

const CARD: React.CSSProperties = {
  background: "#1a1f2e",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

const BIN_SIZE = 5.0;

const ROTATION_STATES = new Set(["Drilling", "Rotating Off-Bottom", "Reaming"]);

function computeBroomstickBins(history: StreamPayload[]) {
  const bins: Record<
    number,
    {
      pickup_hl: number[];
      slackoff_hl: number[];
      rotation_hl: number[];
      rotation_torque: number[];
    }
  > = {};

  let prevDepth: number | null = null;

  for (const payload of history) {
    const rec = payload.record;
    const depth = rec.measured_depth ?? rec.block_position;
    if (depth == null || rec.hookload == null) {
      prevDepth = depth ?? prevDepth;
      continue;
    }

    const binKey = Math.round(depth / BIN_SIZE) * BIN_SIZE;
    if (!bins[binKey]) {
      bins[binKey] = {
        pickup_hl: [],
        slackoff_hl: [],
        rotation_hl: [],
        rotation_torque: [],
      };
    }

    let depthDelta = 0;
    if (prevDepth != null) {
      depthDelta = depth - prevDepth;
    }
    prevDepth = depth;

    if (depthDelta < -0.01) {
      bins[binKey].pickup_hl.push(rec.hookload);
    } else if (depthDelta > 0.01) {
      bins[binKey].slackoff_hl.push(rec.hookload);
    }

    const state = payload.rig_state?.state ?? "";
    if (ROTATION_STATES.has(state)) {
      bins[binKey].rotation_hl.push(rec.hookload);
      if (rec.surface_torque != null) {
        bins[binKey].rotation_torque.push(rec.surface_torque);
      }
    }
  }

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return Object.entries(bins)
    .map(([key, data]) => ({
      depth_bin: Number(key),
      pickup_hookload: avg(data.pickup_hl),
      slackoff_hookload: avg(data.slackoff_hl),
      rotation_hookload: avg(data.rotation_hl),
      rotation_torque: avg(data.rotation_torque),
      sample_count:
        data.pickup_hl.length +
        data.slackoff_hl.length +
        data.rotation_hl.length,
    }))
    .sort((a, b) => a.depth_bin - b.depth_bin);
}

export default function BroomstickView({ history }: Props) {
  const bins = useMemo(() => computeBroomstickBins(history), [history]);

  const pickupData = useMemo(
    () =>
      bins
        .filter((b) => b.pickup_hookload != null)
        .map((b) => ({ depth: b.depth_bin, hookload: b.pickup_hookload })),
    [bins]
  );
  const slackoffData = useMemo(
    () =>
      bins
        .filter((b) => b.slackoff_hookload != null)
        .map((b) => ({ depth: b.depth_bin, hookload: b.slackoff_hookload })),
    [bins]
  );
  const rotationData = useMemo(
    () =>
      bins
        .filter((b) => b.rotation_hookload != null)
        .map((b) => ({ depth: b.depth_bin, hookload: b.rotation_hookload })),
    [bins]
  );

  return (
    <div>
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Broomstick Chart — Hookload vs Depth
        </h3>
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis
              type="number"
              dataKey="hookload"
              name="Hookload"
              unit=" klbf"
              stroke="#718096"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="depth"
              name="Depth"
              unit=" m"
              reversed
              stroke="#718096"
              tick={{ fontSize: 10 }}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#1a1f2e",
                border: "1px solid #4a5568",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Scatter
              name="Pickup"
              data={pickupData}
              fill="#38b2ac"
              isAnimationActive={false}
            />
            <Scatter
              name="Slack-Off"
              data={slackoffData}
              fill="#ed8936"
              isAnimationActive={false}
            />
            <Scatter
              name="Rotation"
              data={rotationData}
              fill="#9f7aea"
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Torque broomstick */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Rotation Torque vs Depth
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis
              type="number"
              dataKey="rotation_torque"
              name="Torque"
              unit=" kft·lbf"
              stroke="#718096"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="depth_bin"
              name="Depth"
              unit=" m"
              reversed
              stroke="#718096"
              tick={{ fontSize: 10 }}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1f2e",
                border: "1px solid #4a5568",
              }}
            />
            <Scatter
              name="Rotation Torque"
              data={bins.filter((b) => b.rotation_torque != null)}
              fill="#f6ad55"
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
