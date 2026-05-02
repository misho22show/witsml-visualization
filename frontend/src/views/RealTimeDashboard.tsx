import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ConfidenceBadge from "../components/ConfidenceBadge";
import { StreamPayload } from "../utils/types";

interface Props {
  history: StreamPayload[];
  latest: StreamPayload | null;
}

const CARD: React.CSSProperties = {
  background: "#1a1f2e",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

export default function RealTimeDashboard({ history, latest }: Props) {
  const chartData = history.slice(-200).map((p) => ({
    time: p.record.time,
    depth: p.record.measured_depth,
    hookload: p.record.hookload,
    torque: p.record.surface_torque,
    rpm: p.record.rpm,
    flow: p.record.flow_rate,
    pressure: p.record.standpipe_pressure,
  }));

  return (
    <div>
      {/* Current state banner */}
      {latest && (
        <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#a0aec0" }}>Rig State</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{latest.rig_state.state}</div>
          </div>
          <ConfidenceBadge level={latest.rig_state.confidence} size="md" />
          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            {latest.quality.map((q) => (
              <div key={q.feature} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#a0aec0" }}>{q.feature}</div>
                <ConfidenceBadge level={q.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-channel chart */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Real-Time Channels</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#718096" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="left" type="monotone" dataKey="hookload" stroke="#38b2ac" dot={false} strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="torque" stroke="#ed8936" dot={false} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="rpm" stroke="#9f7aea" dot={false} strokeWidth={1.5} />
            <Line yAxisId="right" type="monotone" dataKey="flow" stroke="#63b3ed" dot={false} strokeWidth={1.5} />
            <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#fc8181" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Depth chart */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Depth vs Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis reversed stroke="#718096" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568" }} />
            <Line type="monotone" dataKey="depth" stroke="#48bb78" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Events log */}
      {latest && latest.events.length > 0 && (
        <div style={CARD}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Events</h3>
          {latest.events.map((e, i) => (
            <div
              key={i}
              style={{
                padding: "4px 8px",
                marginBottom: 4,
                borderLeft: "3px solid #ed8936",
                fontSize: 12,
              }}
            >
              <strong>{e.event_type}</strong> at t={e.time.toFixed(1)}{" "}
              <ConfidenceBadge level={e.confidence} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
