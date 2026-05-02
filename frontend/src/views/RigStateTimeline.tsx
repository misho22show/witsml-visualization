import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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

const STATE_INDEX: Record<string, number> = {
  Drilling: 7,
  "Rotating Off-Bottom": 6,
  Sliding: 5,
  RIH: 4,
  POOH: 3,
  Reaming: 2,
  "Static / Connection": 1,
  Unknown: 0,
};

const CARD: React.CSSProperties = {
  background: "#1a1f2e",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

export default function RigStateTimeline({ history }: Props) {
  const timelineData = history.slice(-300).map((p) => ({
    time: p.record.time,
    stateIdx: STATE_INDEX[p.rig_state.state] ?? 0,
    state: p.rig_state.state,
  }));

  // Distribution
  const counts: Record<string, number> = {};
  for (const p of history) {
    const s = p.rig_state.state;
    counts[s] = (counts[s] || 0) + 1;
  }
  const total = history.length || 1;
  const distData = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([state, count]) => ({
      state,
      count,
      pct: ((count / total) * 100).toFixed(1),
    }));

  return (
    <div>
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Rig-State Timeline</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={timelineData} barSize={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 10 }} />
            <YAxis
              domain={[0, 8]}
              ticks={Object.values(STATE_INDEX)}
              tickFormatter={(v: number) => {
                const entry = Object.entries(STATE_INDEX).find(([, idx]) => idx === v);
                return entry ? entry[0] : "";
              }}
              stroke="#718096"
              tick={{ fontSize: 9 }}
              width={120}
            />
            <Tooltip
              contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568" }}
              formatter={(_value, _name, props) => [
                (props.payload as { state: string })?.state ?? "",
                "State",
              ]}
            />
            <Bar dataKey="stateIdx" name="State">
              {timelineData.map((entry, i) => (
                <Cell key={i} fill={STATE_COLORS[entry.state] ?? "#4a5568"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / distribution */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>State Distribution</h3>
        {distData.map((d) => (
          <div key={d.state} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: STATE_COLORS[d.state] ?? "#4a5568",
                marginRight: 8,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, fontSize: 12 }}>{d.state}</span>
            <span style={{ fontSize: 12, color: "#a0aec0", marginRight: 8 }}>{d.count}</span>
            <div
              style={{
                width: 120,
                height: 8,
                background: "#2d3748",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${d.pct}%`,
                  height: "100%",
                  background: STATE_COLORS[d.state] ?? "#4a5568",
                  borderRadius: 4,
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: "#a0aec0", marginLeft: 8, minWidth: 40 }}>
              {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
