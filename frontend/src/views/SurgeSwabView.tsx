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
  ReferenceLine,
} from "recharts";
import ConfidenceBadge from "../components/ConfidenceBadge";
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

const CONDITION_COLORS: Record<string, string> = {
  Surge: "#e53e3e",
  Swab: "#ed8936",
  Neutral: "#38b2ac",
  Unclassified: "#718096",
};

export default function SurgeSwabView({ history }: Props) {
  const chartData = history.slice(-200).map((p) => ({
    time: p.record.time,
    pressure_deviation: p.surge_swab?.pressure_deviation ?? 0,
    movement_rate: p.surge_swab?.movement_rate ?? 0,
    severity: p.surge_swab?.severity ?? 0,
  }));

  const surgeSwabEvents = history
    .filter(
      (p) =>
        p.surge_swab &&
        p.surge_swab.condition !== "Neutral" &&
        p.surge_swab.condition !== "Unclassified"
    )
    .slice(-50);

  return (
    <div>
      {/* Movement rate chart */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Movement Rate</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Time (s)", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }} />
            <YAxis stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Rate (m/s)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#4a5568" />
            <Line type="monotone" dataKey="movement_rate" stroke="#63b3ed" dot={false} strokeWidth={2} name="Rate (m/s)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pressure deviation chart */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Pressure Deviation from Baseline</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Time (s)", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }} />
            <YAxis stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "ΔP (psi)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#4a5568" />
            <Line type="monotone" dataKey="pressure_deviation" stroke="#fc8181" dot={false} strokeWidth={2} name="ΔP (psi)" />
            <Line type="monotone" dataKey="severity" stroke="#f6ad55" dot={false} strokeWidth={1.5} name="Severity" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Event table */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Detected Surge / Swab Events ({surgeSwabEvents.length})
        </h3>
        {surgeSwabEvents.length === 0 ? (
          <div style={{ color: "#718096", fontSize: 13 }}>No surge/swab events detected yet.</div>
        ) : (
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2d3748", color: "#a0aec0" }}>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Time (s)</th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Depth (m)</th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Condition</th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>ΔP (psi)</th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Rate (m/s)</th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Severity</th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {surgeSwabEvents.map((p, i) => {
                const e = p.surge_swab!;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #1e2433" }}>
                    <td style={{ padding: "5px 8px" }}>{e.time.toFixed(1)}</td>
                    <td style={{ padding: "5px 8px" }}>{e.depth?.toFixed(1) ?? "—"}</td>
                    <td style={{ padding: "5px 8px", color: CONDITION_COLORS[e.condition] }}>
                      {e.condition}
                    </td>
                    <td style={{ padding: "5px 8px" }}>{e.pressure_deviation.toFixed(1)}</td>
                    <td style={{ padding: "5px 8px" }}>{e.movement_rate.toFixed(4)}</td>
                    <td style={{ padding: "5px 8px" }}>{e.severity.toFixed(1)}</td>
                    <td style={{ padding: "5px 8px" }}>
                      <ConfidenceBadge level={e.confidence} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
