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
  LineChart,
  Line,
} from "recharts";
import { AccumulatedData, BroomstickBin } from "../utils/types";

interface Props {
  accumulated: AccumulatedData;
  accVersion: number;
}

const CARD: React.CSSProperties = {
  background: "#1a1f2e",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

function accToBins(accumulated: AccumulatedData): BroomstickBin[] {
  return Object.entries(accumulated.broomstickBins)
    .map(([key, b]) => ({
      depth_bin: Number(key),
      pickup_hookload: b.pickup_count > 0 ? b.pickup_sum / b.pickup_count : null,
      slackoff_hookload: b.slackoff_count > 0 ? b.slackoff_sum / b.slackoff_count : null,
      rotation_hookload: b.rotation_count > 0 ? b.rotation_sum / b.rotation_count : null,
      rotation_torque: b.torque_count > 0 ? b.torque_sum / b.torque_count : null,
      sample_count: b.pickup_count + b.slackoff_count + b.rotation_count,
    }))
    .sort((a, b) => a.depth_bin - b.depth_bin);
}

export default function BroomstickView({ accumulated, accVersion }: Props) {
  const bins = useMemo(() => accToBins(accumulated), [accumulated, accVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickupData = useMemo(
    () => bins.filter((b) => b.pickup_hookload != null).map((b) => ({ depth: b.depth_bin, hookload: b.pickup_hookload })),
    [bins]
  );
  const slackoffData = useMemo(
    () => bins.filter((b) => b.slackoff_hookload != null).map((b) => ({ depth: b.depth_bin, hookload: b.slackoff_hookload })),
    [bins]
  );
  const rotationData = useMemo(
    () => bins.filter((b) => b.rotation_hookload != null).map((b) => ({ depth: b.depth_bin, hookload: b.rotation_hookload })),
    [bins]
  );

  // Trend line data (sorted by depth for connected line)
  const trendData = useMemo(() => {
    return bins.map((b) => ({
      depth: b.depth_bin,
      pickup: b.pickup_hookload,
      slackoff: b.slackoff_hookload,
      rotation: b.rotation_hookload,
    }));
  }, [bins]);

  const torqueData = useMemo(
    () => bins.filter((b) => b.rotation_torque != null).map((b) => ({
      depth_bin: b.depth_bin,
      rotation_torque: b.rotation_torque,
    })),
    [bins]
  );

  const totalSamples = bins.reduce((s, b) => s + b.sample_count, 0);

  return (
    <div>
      {/* Stats strip */}
      <div style={{ ...CARD, display: "flex", gap: 24, padding: "10px 16px", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Depth Bins: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{bins.length}</span>
        </div>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Total Samples: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{totalSamples.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Pickup: <span style={{ color: "#38b2ac", fontWeight: 600 }}>{pickupData.length}</span>
        </div>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Slack-Off: <span style={{ color: "#ed8936", fontWeight: 600 }}>{slackoffData.length}</span>
        </div>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Rotation: <span style={{ color: "#9f7aea", fontWeight: 600 }}>{rotationData.length}</span>
        </div>
      </div>

      {/* Broomstick scatter + trend */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Broomstick Chart — Hookload vs Depth</h3>
        <ResponsiveContainer width="100%" height={480}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis type="number" dataKey="hookload" name="Hookload" unit=" klbf" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis
              type="number" dataKey="depth" name="Depth" unit=" m"
              reversed stroke="#718096" tick={{ fontSize: 10 }}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Scatter name="Pickup" data={pickupData} fill="#38b2ac" isAnimationActive={false} />
            <Scatter name="Slack-Off" data={slackoffData} fill="#ed8936" isAnimationActive={false} />
            <Scatter name="Rotation" data={rotationData} fill="#9f7aea" isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Trend lines chart */}
      {trendData.length > 1 && (
        <div style={CARD}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Hookload Trend Lines vs Depth</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis type="number" stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Hookload (klbf)", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }} />
              <YAxis
                type="number" dataKey="depth" reversed stroke="#718096"
                tick={{ fontSize: 10 }} domain={["dataMin - 5", "dataMax + 5"]}
                label={{ value: "Depth (m)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }}
              />
              <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="pickup" stroke="#38b2ac" strokeWidth={2} dot={{ r: 3 }} name="Pickup" connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="slackoff" stroke="#ed8936" strokeWidth={2} dot={{ r: 3 }} name="Slack-Off" connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="rotation" stroke="#9f7aea" strokeWidth={2} dot={{ r: 3 }} name="Rotation" connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Torque broomstick */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Rotation Torque vs Depth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis type="number" dataKey="rotation_torque" name="Torque" unit=" kft·lbf" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis
              type="number" dataKey="depth_bin" name="Depth" unit=" m"
              reversed stroke="#718096" tick={{ fontSize: 10 }}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
            <Scatter name="Rotation Torque" data={torqueData} fill="#f6ad55" isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
