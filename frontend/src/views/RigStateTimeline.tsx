import React, { useMemo } from "react";
import { AccumulatedData, StreamPayload } from "../utils/types";

interface Props {
  history: StreamPayload[];
  accumulated: AccumulatedData;
  accVersion: number;
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

const CARD: React.CSSProperties = {
  background: "#1a1f2e",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

interface StateSegment {
  state: string;
  startTime: number;
  endTime: number;
  startIdx: number;
  endIdx: number;
}

export default function RigStateTimeline({ history, accumulated, accVersion }: Props) {
  // Build segments from history for the colored strip
  const segments = useMemo(() => {
    const segs: StateSegment[] = [];
    const data = history.slice(-1000);
    if (data.length === 0) return segs;

    let current: StateSegment = {
      state: data[0].rig_state.state,
      startTime: data[0].record.time,
      endTime: data[0].record.time,
      startIdx: 0,
      endIdx: 0,
    };

    for (let i = 1; i < data.length; i++) {
      const s = data[i].rig_state.state;
      const t = data[i].record.time;
      if (s === current.state) {
        current.endTime = t;
        current.endIdx = i;
      } else {
        segs.push(current);
        current = { state: s, startTime: t, endTime: t, startIdx: i, endIdx: i };
      }
    }
    segs.push(current);
    return segs;
  }, [history]);

  const totalTime = segments.length > 0
    ? segments[segments.length - 1].endTime - segments[0].startTime
    : 1;

  const startTime = segments.length > 0 ? segments[0].startTime : 0;

  // Accumulated distribution (full replay, never trimmed)
  const distData = useMemo(() => {
    const total = Object.values(accumulated.rigStateCounts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(accumulated.rigStateCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([state, count]) => ({
        state,
        count,
        pct: ((count / total) * 100).toFixed(1),
      }));
  }, [accumulated, accVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Event markers from accumulated detected events
  const eventMarkers = useMemo(() => {
    return accumulated.detectedEvents.slice(-100);
  }, [accumulated, accVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Colored strip timeline */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Rig-State Timeline</h3>
        {segments.length === 0 ? (
          <div style={{ color: "#718096", fontSize: 13 }}>No data yet — start replay.</div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                height: 40,
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #2d3748",
              }}
            >
              {segments.map((seg, i) => {
                const width = ((seg.endTime - seg.startTime) / totalTime) * 100;
                return (
                  <div
                    key={i}
                    title={`${seg.state} (${(seg.endTime - seg.startTime).toFixed(0)}s)`}
                    style={{
                      width: `${Math.max(width, 0.2)}%`,
                      background: STATE_COLORS[seg.state] ?? "#4a5568",
                      minWidth: 1,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "0.7"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
                  />
                );
              })}
            </div>
            {/* Time labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#718096" }}>{startTime.toFixed(0)}s</span>
              <span style={{ fontSize: 10, color: "#718096" }}>{(startTime + totalTime).toFixed(0)}s</span>
            </div>
          </>
        )}

        {/* State legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
          {Object.entries(STATE_COLORS).map(([state, color]) => (
            <div key={state} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 10, color: "#a0aec0" }}>{state}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Depth track with state */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>State vs Depth</h3>
        {history.length === 0 ? (
          <div style={{ color: "#718096", fontSize: 13 }}>No data yet.</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {(() => {
              const sampled = history.filter((_, i) => i % 4 === 0).slice(-200);
              return sampled.map((p, i) => {
                const depth = p.record.measured_depth;
                if (depth == null) return null;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: 3,
                    }}
                  >
                    <span style={{ fontSize: 8, color: "#718096", width: 55, textAlign: "right", marginRight: 6, flexShrink: 0 }}>
                      {depth.toFixed(0)}m
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "100%",
                        background: STATE_COLORS[p.rig_state.state] ?? "#4a5568",
                      }}
                    />
                    <span style={{ fontSize: 7, color: "#718096", marginLeft: 6, width: 80, flexShrink: 0 }}>
                      {p.rig_state.state}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Distribution (accumulated — full replay) */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 4 }}>
          State Distribution
          <span style={{ fontSize: 11, color: "#718096", fontWeight: 400, marginLeft: 8 }}>
            (full replay — {accumulated.totalProcessed.toLocaleString()} records)
          </span>
        </h3>
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
            <span style={{ fontSize: 12, color: "#a0aec0", marginRight: 8 }}>{d.count.toLocaleString()}</span>
            <div
              style={{
                width: 140,
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
            <span style={{ fontSize: 11, color: "#a0aec0", marginLeft: 8, minWidth: 45, textAlign: "right" }}>
              {d.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Detected Events */}
      {eventMarkers.length > 0 && (
        <div style={CARD}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Detected Events ({eventMarkers.length})</h3>
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2d3748", color: "#a0aec0" }}>
                  <th style={{ padding: "4px 8px", textAlign: "left" }}>Time</th>
                  <th style={{ padding: "4px 8px", textAlign: "left" }}>Depth</th>
                  <th style={{ padding: "4px 8px", textAlign: "left" }}>Event</th>
                  <th style={{ padding: "4px 8px", textAlign: "left" }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {eventMarkers.slice(-30).map((e, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1e2433" }}>
                    <td style={{ padding: "3px 8px" }}>{e.time.toFixed(0)}s</td>
                    <td style={{ padding: "3px 8px" }}>{e.depth?.toFixed(1) ?? "—"}m</td>
                    <td style={{ padding: "3px 8px", color: "#63b3ed" }}>{e.event_type}</td>
                    <td style={{ padding: "3px 8px", color: e.confidence === "High" ? "#38b2ac" : "#ed8936" }}>{e.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
