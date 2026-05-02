import React, { useMemo } from "react";
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
import GaugePanel from "../components/GaugePanel";
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

const STATE_COLORS: Record<string, string> = {
  Drilling: "#38b2ac",
  "Rotating Off-Bottom": "#9f7aea",
  Sliding: "#ed8936",
  RIH: "#63b3ed",
  POOH: "#fc8181",
  "Static / Connection": "#718096",
  Reaming: "#f6ad55",
  Unknown: "#4a5568",
};

const STATE_ICONS: Record<string, string> = {
  Drilling: "⬇",
  "Rotating Off-Bottom": "🔄",
  Sliding: "📐",
  RIH: "⬇",
  POOH: "⬆",
  "Static / Connection": "⏸",
  Reaming: "🔃",
  Unknown: "—",
};

export default function RealTimeDashboard({ history, latest }: Props) {
  const chartData = useMemo(() => history.slice(-500).map((p) => ({
    time: p.record.time,
    depth: p.record.measured_depth,
    hookload: p.record.hookload,
    torque: p.record.surface_torque,
    rpm: p.record.rpm,
    flow: p.record.flow_rate,
    pressure: p.record.standpipe_pressure,
    rop: p.record.rop,
  })), [history]);

  const rigState = latest?.rig_state.state ?? "—";
  const rigStateColor = STATE_COLORS[rigState] ?? "#4a5568";

  return (
    <div>
      {/* Top row: Rig State + Gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, marginBottom: 12 }}>
        {/* Current Rig State */}
        <div
          style={{
            ...CARD,
            marginBottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderLeft: `4px solid ${rigStateColor}`,
            minHeight: 120,
          }}
        >
          <div style={{ fontSize: 10, color: "#a0aec0", letterSpacing: 1, textTransform: "uppercase" }}>
            Current State
          </div>
          <div style={{ fontSize: 28, marginTop: 4 }}>
            {STATE_ICONS[rigState] ?? "—"}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: rigStateColor,
              marginTop: 4,
            }}
          >
            {rigState}
          </div>
          {latest && (
            <div style={{ marginTop: 6 }}>
              <ConfidenceBadge level={latest.rig_state.confidence} size="sm" />
            </div>
          )}
        </div>

        {/* Gauges */}
        <div style={{ ...CARD, marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 10, color: "#a0aec0", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>
            Key Parameters
          </div>
          <GaugePanel
            hookload={latest?.record.hookload ?? null}
            rop={latest?.record.rop ?? null}
            flowRate={latest?.record.flow_rate ?? null}
            spp={latest?.record.standpipe_pressure ?? null}
          />
        </div>
      </div>

      {/* Confidence strip */}
      {latest && (
        <div
          style={{
            ...CARD,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "8px 16px",
          }}
        >
          <span style={{ fontSize: 11, color: "#a0aec0", fontWeight: 600 }}>Data Confidence:</span>
          {latest.quality.map((q) => (
            <div key={q.feature} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#e2e8f0" }}>{q.feature}</span>
              <ConfidenceBadge level={q.confidence} />
            </div>
          ))}
          {latest.record.measured_depth != null && (
            <div style={{ marginLeft: "auto", fontSize: 12, color: "#a0aec0" }}>
              Depth: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{latest.record.measured_depth.toFixed(1)} m</span>
            </div>
          )}
        </div>
      )}

      {/* Multi-channel chart — dedicated Y-axis per channel */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Real-Time Channels</h3>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ left: 60, right: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis
              dataKey="time"
              stroke="#718096"
              tick={{ fontSize: 10 }}
              label={{ value: "Time (s)", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }}
            />
            {/* Hookload axis (left, outermost) */}
            <YAxis
              yAxisId="hookload"
              orientation="left"
              stroke="#38b2ac"
              tick={{ fontSize: 9, fill: "#38b2ac" }}
              label={{ value: "klbf", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 9, fill: "#38b2ac" } }}
            />
            {/* Torque axis (left, inner) */}
            <YAxis
              yAxisId="torque"
              orientation="left"
              stroke="#ed8936"
              tick={{ fontSize: 9, fill: "#ed8936" }}
              label={{ value: "kft·lbf", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 9, fill: "#ed8936" } }}
            />
            {/* RPM axis (right, innermost) */}
            <YAxis
              yAxisId="rpm"
              orientation="right"
              stroke="#9f7aea"
              tick={{ fontSize: 9, fill: "#9f7aea" }}
              label={{ value: "rpm", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 9, fill: "#9f7aea" } }}
            />
            {/* Flow axis (right, middle) */}
            <YAxis
              yAxisId="flow"
              orientation="right"
              stroke="#63b3ed"
              tick={{ fontSize: 9, fill: "#63b3ed" }}
              label={{ value: "gpm", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 9, fill: "#63b3ed" } }}
            />
            {/* SPP axis (right, outermost) */}
            <YAxis
              yAxisId="spp"
              orientation="right"
              stroke="#fc8181"
              tick={{ fontSize: 9, fill: "#fc8181" }}
              label={{ value: "psi", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 9, fill: "#fc8181" } }}
            />
            <Tooltip
              contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="hookload" type="monotone" dataKey="hookload" stroke="#38b2ac" dot={false} strokeWidth={2} name="Hookload (klbf)" isAnimationActive={false} />
            <Line yAxisId="torque" type="monotone" dataKey="torque" stroke="#ed8936" dot={false} strokeWidth={2} name="Torque (kft·lbf)" isAnimationActive={false} />
            <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#9f7aea" dot={false} strokeWidth={1.5} name="RPM" isAnimationActive={false} />
            <Line yAxisId="flow" type="monotone" dataKey="flow" stroke="#63b3ed" dot={false} strokeWidth={1.5} name="Flow (gpm)" isAnimationActive={false} />
            <Line yAxisId="spp" type="monotone" dataKey="pressure" stroke="#fc8181" dot={false} strokeWidth={1.5} name="SPP (psi)" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Depth and ROP charts side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={CARD}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Depth vs Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis
                dataKey="time"
                stroke="#718096"
                tick={{ fontSize: 10 }}
                label={{ value: "Time (s)", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }}
              />
              <YAxis
                reversed
                stroke="#718096"
                tick={{ fontSize: 10 }}
                label={{ value: "Depth (m)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }}
              />
              <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
              <Line type="monotone" dataKey="depth" stroke="#48bb78" dot={false} strokeWidth={2} name="Depth (m)" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={CARD}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>ROP vs Depth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis
                dataKey="depth"
                stroke="#718096"
                tick={{ fontSize: 10 }}
                type="number"
                domain={["dataMin", "dataMax"]}
                label={{ value: "Depth (m)", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }}
              />
              <YAxis
                stroke="#718096"
                tick={{ fontSize: 10 }}
                label={{ value: "ROP (ft/hr)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }}
              />
              <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
              <Line type="monotone" dataKey="rop" stroke="#f6e05e" dot={false} strokeWidth={2} name="ROP (ft/hr)" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
              <strong>{e.event_type}</strong> at t={e.time.toFixed(1)}s{" "}
              <ConfidenceBadge level={e.confidence} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
