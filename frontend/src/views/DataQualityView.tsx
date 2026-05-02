import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
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
  latest: StreamPayload | null;
  history: StreamPayload[];
}

const CARD: React.CSSProperties = {
  background: "#1a1f2e",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

const CONFIDENCE_COLORS = {
  High: "#38b2ac",
  Medium: "#ed8936",
  Low: "#e53e3e",
};

export default function DataQualityView({ latest, history }: Props) {
  const quality = latest?.quality ?? [];

  // Aggregate confidence history per feature
  const featureHistory: Record<string, { High: number; Medium: number; Low: number }> = {};
  for (const p of history) {
    for (const q of p.quality) {
      if (!featureHistory[q.feature]) featureHistory[q.feature] = { High: 0, Medium: 0, Low: 0 };
      if (q.confidence in featureHistory[q.feature]) {
        featureHistory[q.feature][q.confidence as "High" | "Medium" | "Low"]++;
      }
    }
  }

  // Chart data for stacked bar
  const chartData = useMemo(() => {
    return Object.entries(featureHistory).map(([feature, counts]) => {
      const total = counts.High + counts.Medium + counts.Low || 1;
      return {
        feature,
        High: +((counts.High / total) * 100).toFixed(1),
        Medium: +((counts.Medium / total) * 100).toFixed(1),
        Low: +((counts.Low / total) * 100).toFixed(1),
      };
    });
  }, [history]); // eslint-disable-line react-hooks/exhaustive-deps

  // Channel availability matrix
  const channelMatrix = useMemo(() => {
    if (!latest) return [];
    const allChannels = new Set<string>();
    for (const q of latest.quality) {
      for (const c of q.available_channels) allChannels.add(c);
      for (const c of q.missing_channels) allChannels.add(c);
    }
    return Array.from(allChannels).map((channel) => {
      const features: Record<string, boolean> = {};
      for (const q of latest.quality) {
        features[q.feature] = q.available_channels.includes(channel);
      }
      return { channel, features };
    });
  }, [latest]);

  return (
    <div>
      {/* Current quality cards */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Current Data Quality</h3>
        {quality.length === 0 ? (
          <div style={{ color: "#718096", fontSize: 13 }}>No data yet — start replay.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {quality.map((q) => (
              <div
                key={q.feature}
                style={{
                  background: "#0f1419",
                  borderRadius: 6,
                  padding: 14,
                  border: `1px solid ${q.confidence === "High" ? "#2d3748" : q.confidence === "Medium" ? "#744210" : "#742a2a"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{q.feature}</span>
                  <ConfidenceBadge level={q.confidence} size="md" />
                </div>
                <div style={{ fontSize: 11, color: "#a0aec0" }}>
                  <div style={{ marginBottom: 3 }}>
                    <span style={{ color: "#38b2ac" }}>Available:</span>{" "}
                    {q.available_channels.length > 0 ? q.available_channels.join(", ") : "—"}
                  </div>
                  <div style={{ color: q.missing_channels.length > 0 ? "#fc8181" : "#a0aec0" }}>
                    <span style={{ color: q.missing_channels.length > 0 ? "#fc8181" : "#38b2ac" }}>Missing:</span>{" "}
                    {q.missing_channels.length > 0 ? q.missing_channels.join(", ") : "None"}
                  </div>
                </div>
                {q.notes && (
                  <div style={{ marginTop: 6, fontSize: 10, color: "#ed8936", fontStyle: "italic" }}>{q.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stacked bar chart for quality distribution */}
      {chartData.length > 0 && (
        <div style={CARD}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Quality Distribution Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis type="number" domain={[0, 100]} stroke="#718096" tick={{ fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="feature" stroke="#718096" tick={{ fontSize: 10 }} width={90} />
              <Tooltip
                contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568", fontSize: 11 }}
                formatter={(value, name) => [`${value}%`, String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="High" stackId="a" fill={CONFIDENCE_COLORS.High} isAnimationActive={false} name="High" />
              <Bar dataKey="Medium" stackId="a" fill={CONFIDENCE_COLORS.Medium} isAnimationActive={false} name="Medium" />
              <Bar dataKey="Low" stackId="a" fill={CONFIDENCE_COLORS.Low} isAnimationActive={false} name="Low" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Channel availability matrix */}
      {channelMatrix.length > 0 && (
        <div style={CARD}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Channel Availability Matrix</h3>
          <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2d3748", color: "#a0aec0" }}>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Channel</th>
                {quality.map((q) => (
                  <th key={q.feature} style={{ padding: "6px 8px", textAlign: "center" }}>{q.feature}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channelMatrix.map((row) => (
                <tr key={row.channel} style={{ borderBottom: "1px solid #1e2433" }}>
                  <td style={{ padding: "4px 8px", fontWeight: 600 }}>{row.channel}</td>
                  {quality.map((q) => (
                    <td key={q.feature} style={{ padding: "4px 8px", textAlign: "center" }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: row.features[q.feature] ? "#38b2ac" : "#2d3748",
                          margin: "0 auto",
                          border: row.features[q.feature] ? "none" : "1px solid #4a5568",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
