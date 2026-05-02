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
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import ConfidenceBadge from "../components/ConfidenceBadge";
import { AccumulatedData, StreamPayload } from "../utils/types";

interface Props {
  history: StreamPayload[];
  accumulated: AccumulatedData;
  accVersion: number;
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

export default function SurgeSwabView({ history, accumulated, accVersion }: Props) {
  const chartData = useMemo(() => history.slice(-500).map((p) => ({
    time: p.record.time,
    pressure_deviation: p.surge_swab?.pressure_deviation ?? 0,
    movement_rate: p.surge_swab?.movement_rate ?? 0,
    severity: p.surge_swab?.severity ?? 0,
    depth: p.record.measured_depth,
    condition: p.surge_swab?.condition ?? "Neutral",
  })), [history]);

  // Current condition from latest data
  const latestPayload = history.length > 0 ? history[history.length - 1] : null;
  const currentCondition = latestPayload?.surge_swab?.condition ?? "—";
  const currentConfidence = latestPayload?.surge_swab?.confidence ?? "—";
  const currentMovement = latestPayload?.surge_swab?.movement_rate ?? 0;
  const currentPressureDev = latestPayload?.surge_swab?.pressure_deviation ?? 0;

  // Use accumulated surge events for the event table
  const surgeSwabEvents = useMemo(
    () => accumulated.surgeEvents.slice(-50),
    [accumulated, accVersion] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Count surge vs swab events
  const surgeCount = useMemo(
    () => accumulated.surgeEvents.filter((e) => e.condition === "Surge").length,
    [accumulated, accVersion] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const swabCount = useMemo(
    () => accumulated.surgeEvents.filter((e) => e.condition === "Swab").length,
    [accumulated, accVersion] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div>
      {/* Current condition indicator */}
      <div style={{ ...CARD, display: "flex", gap: 24, padding: "12px 20px", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#a0aec0", letterSpacing: 1, textTransform: "uppercase" }}>Current Condition</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: CONDITION_COLORS[currentCondition] ?? "#718096", marginTop: 4 }}>
            {currentCondition}
          </div>
          {currentConfidence !== "—" && (
            <div style={{ marginTop: 4 }}><ConfidenceBadge level={currentConfidence} size="sm" /></div>
          )}
        </div>
        <div style={{ width: 1, height: 40, background: "#2d3748" }} />
        <div>
          <div style={{ fontSize: 11, color: "#a0aec0" }}>
            Movement: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{currentMovement.toFixed(4)} m/s</span>
          </div>
          <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 4 }}>
            Pressure Dev: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{currentPressureDev.toFixed(1)} psi</span>
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: "#2d3748" }} />
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e53e3e" }}>{surgeCount}</div>
            <div style={{ fontSize: 10, color: "#a0aec0" }}>Surge Events</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ed8936" }}>{swabCount}</div>
            <div style={{ fontSize: 10, color: "#a0aec0" }}>Swab Events</div>
          </div>
        </div>
      </div>

      {/* Movement rate chart */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Movement Rate</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Time (s)", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }} />
            <YAxis stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Rate (m/s)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#4a5568" strokeWidth={2} />
            <ReferenceArea y1={0} y2={999} fill="rgba(229, 62, 62, 0.05)" label={{ value: "RIH / Surge zone", position: "insideTopRight", style: { fontSize: 9, fill: "#e53e3e44" } }} />
            <ReferenceArea y1={-999} y2={0} fill="rgba(237, 137, 54, 0.05)" label={{ value: "POOH / Swab zone", position: "insideBottomRight", style: { fontSize: 9, fill: "#ed893644" } }} />
            <Line type="monotone" dataKey="movement_rate" stroke="#63b3ed" dot={false} strokeWidth={2} name="Rate (m/s)" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pressure deviation chart */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Pressure Deviation from Baseline</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Time (s)", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }} />
            <YAxis stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "ΔP (psi)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#4a5568" strokeWidth={2} />
            <Line type="monotone" dataKey="pressure_deviation" stroke="#fc8181" dot={false} strokeWidth={2} name="ΔP (psi)" isAnimationActive={false} />
            <Line type="monotone" dataKey="severity" stroke="#f6ad55" dot={false} strokeWidth={1.5} name="Severity" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Depth track */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Depth Track</h3>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis reversed stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Depth (m)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
            <Line type="monotone" dataKey="depth" stroke="#48bb78" dot={false} strokeWidth={2} name="Depth (m)" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Event table */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Detected Surge / Swab Events ({accumulated.surgeEvents.length})
        </h3>
        {surgeSwabEvents.length === 0 ? (
          <div style={{ color: "#718096", fontSize: 13 }}>No surge/swab events detected yet.</div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2d3748", color: "#a0aec0", position: "sticky", top: 0, background: "#1a1f2e" }}>
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
                {surgeSwabEvents.map((e, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1e2433" }}>
                    <td style={{ padding: "5px 8px" }}>{e.time.toFixed(1)}</td>
                    <td style={{ padding: "5px 8px" }}>{e.depth?.toFixed(1) ?? "—"}</td>
                    <td style={{ padding: "5px 8px", color: CONDITION_COLORS[e.condition], fontWeight: 600 }}>
                      {e.condition}
                    </td>
                    <td style={{ padding: "5px 8px" }}>{e.pressure_deviation.toFixed(1)}</td>
                    <td style={{ padding: "5px 8px" }}>{e.movement_rate.toFixed(4)}</td>
                    <td style={{ padding: "5px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{
                          width: Math.min(e.severity * 10, 60),
                          height: 6,
                          borderRadius: 3,
                          background: e.severity > 5 ? "#e53e3e" : e.severity > 2 ? "#ed8936" : "#38b2ac",
                        }} />
                        <span>{e.severity.toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={{ padding: "5px 8px" }}>
                      <ConfidenceBadge level={e.confidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
