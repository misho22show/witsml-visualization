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

function interpolateColor(value: number, min: number, max: number): string {
  const t = max > min ? (value - min) / (max - min) : 0;
  const r = Math.round(56 + t * (252 - 56));
  const g = Math.round(178 - t * (50));
  const b = Math.round(172 - t * (40));
  return `rgb(${r},${g},${b})`;
}

export default function HeatmapView({ history }: Props) {
  const torqueData = useMemo(() => {
    return history
      .filter((p) => p.record.measured_depth != null && p.record.surface_torque != null)
      .map((p) => ({
        depth: p.record.measured_depth!,
        torque: p.record.surface_torque!,
        time: p.record.time,
      }));
  }, [history]);

  const hookloadData = useMemo(() => {
    return history
      .filter((p) => p.record.measured_depth != null && p.record.hookload != null)
      .map((p) => ({
        depth: p.record.measured_depth!,
        hookload: p.record.hookload!,
        time: p.record.time,
      }));
  }, [history]);

  // Time at depth
  const timeAtDepth = useMemo(() => {
    const bins: Record<number, number> = {};
    const binSize = 5;
    for (const p of history) {
      const d = p.record.measured_depth;
      if (d == null) continue;
      const bin = Math.round(d / binSize) * binSize;
      bins[bin] = (bins[bin] || 0) + 1;
    }
    return Object.entries(bins).map(([depth, count]) => ({
      depth: Number(depth),
      samples: count,
    }));
  }, [history]);

  const torqueRange = torqueData.length > 0
    ? { min: Math.min(...torqueData.map((d) => d.torque)), max: Math.max(...torqueData.map((d) => d.torque)) }
    : { min: 0, max: 1 };

  const hookloadRange = hookloadData.length > 0
    ? { min: Math.min(...hookloadData.map((d) => d.hookload)), max: Math.max(...hookloadData.map((d) => d.hookload)) }
    : { min: 0, max: 1 };

  return (
    <div>
      {/* Torque vs Depth */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Torque vs Depth Heatmap</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis type="number" dataKey="torque" name="Torque" unit=" kft·lbf" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey="depth" name="Depth" unit=" m" reversed stroke="#718096" tick={{ fontSize: 10 }} />
            <ZAxis range={[20, 20]} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568" }} />
            <Scatter data={torqueData} name="Torque">
              {torqueData.map((d, i) => (
                <Cell key={i} fill={interpolateColor(d.torque, torqueRange.min, torqueRange.max)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Hookload vs Depth */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Hookload vs Depth Heatmap</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis type="number" dataKey="hookload" name="Hookload" unit=" klbf" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey="depth" name="Depth" unit=" m" reversed stroke="#718096" tick={{ fontSize: 10 }} />
            <ZAxis range={[20, 20]} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568" }} />
            <Scatter data={hookloadData} name="Hookload">
              {hookloadData.map((d, i) => (
                <Cell key={i} fill={interpolateColor(d.hookload, hookloadRange.min, hookloadRange.max)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Time at depth */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Time Spent at Depth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis type="number" dataKey="samples" name="Samples" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey="depth" name="Depth" unit=" m" reversed stroke="#718096" tick={{ fontSize: 10 }} />
            <ZAxis range={[30, 30]} />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568" }} />
            <Scatter data={timeAtDepth} fill="#63b3ed" name="Time at Depth" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
