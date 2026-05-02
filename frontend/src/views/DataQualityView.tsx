import React from "react";
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

  return (
    <div>
      {/* Current quality */}
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
                  border: "1px solid #2d3748",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{q.feature}</div>
                <ConfidenceBadge level={q.confidence} size="md" />
                <div style={{ marginTop: 8, fontSize: 11, color: "#a0aec0" }}>
                  <div>
                    Available: {q.available_channels.length > 0 ? q.available_channels.join(", ") : "—"}
                  </div>
                  <div style={{ color: q.missing_channels.length > 0 ? "#fc8181" : "#a0aec0" }}>
                    Missing: {q.missing_channels.length > 0 ? q.missing_channels.join(", ") : "None"}
                  </div>
                </div>
                {q.notes && (
                  <div style={{ marginTop: 4, fontSize: 10, color: "#ed8936" }}>{q.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical quality distribution */}
      {Object.keys(featureHistory).length > 0 && (
        <div style={CARD}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Quality Distribution Over Time</h3>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2d3748", color: "#a0aec0" }}>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>Feature</th>
                <th style={{ padding: "6px 8px", textAlign: "center" }}>High</th>
                <th style={{ padding: "6px 8px", textAlign: "center" }}>Medium</th>
                <th style={{ padding: "6px 8px", textAlign: "center" }}>Low</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(featureHistory).map(([feature, counts]) => {
                const t = counts.High + counts.Medium + counts.Low || 1;
                return (
                  <tr key={feature} style={{ borderBottom: "1px solid #1e2433" }}>
                    <td style={{ padding: "5px 8px", fontWeight: 600 }}>{feature}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", color: "#38b2ac" }}>
                      {((counts.High / t) * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: "5px 8px", textAlign: "center", color: "#ed8936" }}>
                      {((counts.Medium / t) * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: "5px 8px", textAlign: "center", color: "#e53e3e" }}>
                      {((counts.Low / t) * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
