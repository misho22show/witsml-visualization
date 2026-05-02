import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { AccumulatedData } from "../utils/types";

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

function heatColor(t: number): string {
  // Blue → Cyan → Green → Yellow → Red
  if (t < 0.25) {
    const s = t / 0.25;
    return `rgb(${Math.round(30 + s * 0)}, ${Math.round(60 + s * 180)}, ${Math.round(200 + s * 55)})`;
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return `rgb(${Math.round(30 + s * 70)}, ${Math.round(240 - s * 40)}, ${Math.round(255 - s * 155)})`;
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return `rgb(${Math.round(100 + s * 155)}, ${Math.round(200 - s * 20)}, ${Math.round(100 - s * 80)})`;
  } else {
    const s = (t - 0.75) / 0.25;
    return `rgb(${Math.round(255)}, ${Math.round(180 - s * 140)}, ${Math.round(20 - s * 20)})`;
  }
}

function ColorLegend({ min, max, unit }: { min: number; max: number; unit: string }) {
  const stops = 20;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
      <span style={{ fontSize: 10, color: "#a0aec0" }}>{min.toFixed(0)} {unit}</span>
      <div style={{ display: "flex", flex: 1, height: 10, borderRadius: 3, overflow: "hidden" }}>
        {Array.from({ length: stops }, (_, i) => (
          <div key={i} style={{ flex: 1, background: heatColor(i / (stops - 1)) }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: "#a0aec0" }}>{max.toFixed(0)} {unit}</span>
    </div>
  );
}

export default function HeatmapView({ accumulated, accVersion }: Props) {
  const torqueData = useMemo(() => accumulated.heatmapTorque, [accumulated, accVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const hookloadData = useMemo(() => accumulated.heatmapHookload, [accumulated, accVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeAtDepth = useMemo(() => {
    return Object.entries(accumulated.timeAtDepthBins)
      .map(([depth, count]) => ({
        depth: Number(depth),
        samples: count,
        minutes: +(count * 0.05 / 60).toFixed(1), // ~50ms per sample at 1x speed
      }))
      .sort((a, b) => a.depth - b.depth);
  }, [accumulated, accVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const torqueRange = torqueData.length > 0
    ? { min: Math.min(...torqueData.map((d) => d.torque)), max: Math.max(...torqueData.map((d) => d.torque)) }
    : { min: 0, max: 1 };

  const hookloadRange = hookloadData.length > 0
    ? { min: Math.min(...hookloadData.map((d) => d.hookload)), max: Math.max(...hookloadData.map((d) => d.hookload)) }
    : { min: 0, max: 1 };

  return (
    <div>
      {/* Stats strip */}
      <div style={{ ...CARD, display: "flex", gap: 24, padding: "10px 16px", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Total Points: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{accumulated.totalProcessed.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Torque Data: <span style={{ color: "#f6ad55", fontWeight: 600 }}>{torqueData.length.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Hookload Data: <span style={{ color: "#38b2ac", fontWeight: 600 }}>{hookloadData.length.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>
          Depth Bins: <span style={{ color: "#63b3ed", fontWeight: 600 }}>{timeAtDepth.length}</span>
        </div>
      </div>

      {/* Torque vs Depth */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Torque vs Depth Heatmap</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis type="number" dataKey="torque" name="Torque" unit=" kft·lbf" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey="depth" name="Depth" unit=" m" reversed stroke="#718096" tick={{ fontSize: 10 }} domain={["dataMin - 5", "dataMax + 5"]} />
            <ZAxis range={[18, 18]} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
            <Scatter data={torqueData} name="Torque" isAnimationActive={false}>
              {torqueData.map((d, i) => (
                <Cell key={i} fill={heatColor(torqueRange.max > torqueRange.min ? (d.torque - torqueRange.min) / (torqueRange.max - torqueRange.min) : 0)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <ColorLegend min={torqueRange.min} max={torqueRange.max} unit="kft·lbf" />
      </div>

      {/* Hookload vs Depth */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Hookload vs Depth Heatmap</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis type="number" dataKey="hookload" name="Hookload" unit=" klbf" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey="depth" name="Depth" unit=" m" reversed stroke="#718096" tick={{ fontSize: 10 }} domain={["dataMin - 5", "dataMax + 5"]} />
            <ZAxis range={[18, 18]} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }} />
            <Scatter data={hookloadData} name="Hookload" isAnimationActive={false}>
              {hookloadData.map((d, i) => (
                <Cell key={i} fill={heatColor(hookloadRange.max > hookloadRange.min ? (d.hookload - hookloadRange.min) / (hookloadRange.max - hookloadRange.min) : 0)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <ColorLegend min={hookloadRange.min} max={hookloadRange.max} unit="klbf" />
      </div>

      {/* Time at depth - horizontal bar chart */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Time Spent at Depth</h3>
        <ResponsiveContainer width="100%" height={Math.max(300, timeAtDepth.length * 16)}>
          <BarChart data={timeAtDepth} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis type="number" stroke="#718096" tick={{ fontSize: 10 }} label={{ value: "Samples", position: "insideBottomRight", offset: -4, style: { fontSize: 10, fill: "#718096" } }} />
            <YAxis
              type="category" dataKey="depth" reversed stroke="#718096"
              tick={{ fontSize: 9 }} width={60}
              label={{ value: "Depth (m)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#718096" } }}
            />
            <Tooltip
              contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }}
              formatter={(value, name) => [String(name) === "samples" ? `${value} samples` : value, String(name)]}
            />
            <Bar dataKey="samples" fill="#63b3ed" isAnimationActive={false} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
