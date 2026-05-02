import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { StreamPayload } from "../utils/types";

interface Props {
  history: StreamPayload[];
}

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

type TimeWindow = "10min" | "30min" | "1hr" | "full";
const WINDOWS: { label: string; value: TimeWindow }[] = [
  { label: "10 min", value: "10min" },
  { label: "30 min", value: "30min" },
  { label: "1 hr", value: "1hr" },
  { label: "Full", value: "full" },
];

function windowRecords(history: StreamPayload[], w: TimeWindow): StreamPayload[] {
  if (w === "full" || history.length === 0) return history;
  const lastTime = history[history.length - 1].record.time;
  const seconds = w === "10min" ? 600 : w === "30min" ? 1800 : 3600;
  const cutoff = lastTime - seconds;
  return history.filter((p) => p.record.time >= cutoff);
}

export default function RigStateWidget({ history }: Props) {
  const [window, setWindow] = useState<TimeWindow>("full");

  const { data, dominant } = useMemo(() => {
    const records = windowRecords(history, window);
    const counts: Record<string, number> = {};
    for (const p of records) {
      const s = p.rig_state.state;
      counts[s] = (counts[s] || 0) + 1;
    }
    const total = records.length || 1;
    const data = Object.entries(counts)
      .map(([name, value]) => ({ name, value, pct: ((value / total) * 100).toFixed(1) }))
      .sort((a, b) => b.value - a.value);
    const dominant = data.length > 0 ? data[0].name : "—";
    return { data, dominant };
  }, [history, window]);

  return (
    <div
      style={{
        background: "#1a1f2e",
        borderRadius: 8,
        padding: 16,
        height: "100%",
      }}
    >
      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Rig-State Distribution</h3>

      {/* Window selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {WINDOWS.map((w) => (
          <button
            key={w.value}
            onClick={() => setWindow(w.value)}
            style={{
              padding: "3px 8px",
              fontSize: 11,
              border: "1px solid #4a5568",
              borderRadius: 3,
              background: window === w.value ? "#38b2ac" : "transparent",
              color: window === w.value ? "#fff" : "#a0aec0",
              cursor: "pointer",
            }}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Dominant state */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: "#a0aec0" }}>Dominant</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: STATE_COLORS[dominant] ?? "#fff" }}>
          {dominant}
        </div>
      </div>

      {/* Donut chart */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={STATE_COLORS[d.name] ?? "#4a5568"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }}
            formatter={(value, name) => [`${value} samples`, name]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ marginTop: 4 }}>
        {data.map((d) => (
          <div
            key={d.name}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 11,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: STATE_COLORS[d.name] ?? "#4a5568",
                marginRight: 6,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, color: "#e2e8f0" }}>{d.name}</span>
            <span style={{ color: "#a0aec0" }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
