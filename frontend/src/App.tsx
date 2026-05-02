import React, { useEffect, useState } from "react";
import { fetchJSON } from "./utils/api";
import { WellInfo } from "./utils/types";
import { useWitsmlStream } from "./hooks/useWebSocket";
import ReplayControls from "./components/ReplayControls";
import RigStateWidget from "./components/RigStateWidget";
import RealTimeDashboard from "./views/RealTimeDashboard";
import BroomstickView from "./views/BroomstickView";
import SurgeSwabView from "./views/SurgeSwabView";
import RigStateTimeline from "./views/RigStateTimeline";
import DataQualityView from "./views/DataQualityView";
import HeatmapView from "./views/HeatmapView";

type Tab = "dashboard" | "broomstick" | "surge-swab" | "rig-state" | "quality" | "heatmaps";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Real-Time" },
  { id: "broomstick", label: "Broomstick" },
  { id: "surge-swab", label: "Surge / Swab" },
  { id: "rig-state", label: "Rig State" },
  { id: "quality", label: "Data Quality" },
  { id: "heatmaps", label: "Heatmaps" },
];

export default function App() {
  const [wells, setWells] = useState<WellInfo[]>([]);
  const [selectedWell, setSelectedWell] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");

  const { connected, latest, history, clearHistory } = useWitsmlStream(selectedWell);

  useEffect(() => {
    fetchJSON<WellInfo[]>("/wells")
      .then((w) => {
        setWells(w);
        if (w.length > 0 && !selectedWell) setSelectedWell(w[0].id);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const replayIndex = latest?.replay_index ?? 0;
  const totalRecords = latest?.total_records ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f14", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          padding: "0 20px",
          height: 48,
          background: "linear-gradient(180deg, #141820 0%, #111620 100%)",
          borderBottom: "1px solid #1e2a3a",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: connected ? "#38b2ac" : "#e53e3e",
              boxShadow: connected ? "0 0 6px #38b2ac" : "0 0 6px #e53e3e",
            }}
          />
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", letterSpacing: 0.5 }}>
            WITSML<span style={{ color: "#38b2ac" }}>VIZ</span>
          </h1>
        </div>

        <div style={{ width: 1, height: 24, background: "#2d3748" }} />

        {/* Well selector */}
        <select
          value={selectedWell ?? ""}
          onChange={(e) => {
            setSelectedWell(e.target.value);
            clearHistory();
          }}
          style={{
            padding: "5px 12px",
            background: "#1a1f2e",
            color: "#e2e8f0",
            border: "1px solid #2d3748",
            borderRadius: 4,
            fontSize: 12,
            cursor: "pointer",
            minWidth: 200,
          }}
        >
          {wells.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.record_count} records)
            </option>
          ))}
        </select>

        <span
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 3,
            background: connected ? "rgba(56, 178, 172, 0.15)" : "rgba(229, 62, 62, 0.15)",
            color: connected ? "#38b2ac" : "#e53e3e",
            border: `1px solid ${connected ? "rgba(56, 178, 172, 0.3)" : "rgba(229, 62, 62, 0.3)"}`,
            fontWeight: 600,
          }}
        >
          {connected ? "LIVE" : "OFFLINE"}
        </span>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 10, color: "#4a5568" }}>
          WITSML Real-Time Engineering Dashboard
        </span>
      </header>

      {/* Tabs */}
      <nav
        style={{
          display: "flex",
          gap: 2,
          padding: "6px 20px",
          background: "#0f1419",
          borderBottom: "1px solid #1e2a3a",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 16px",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: tab === t.id ? "#38b2ac" : "transparent",
              color: tab === t.id ? "#fff" : "#718096",
              transition: "all 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Body */}
      <div style={{ display: "flex", padding: "12px 16px", gap: 12 }}>
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedWell && (
            <ReplayControls
              wellId={selectedWell}
              replayIndex={replayIndex}
              totalRecords={totalRecords}
              onReset={clearHistory}
            />
          )}

          {tab === "dashboard" && (
            <RealTimeDashboard history={history} latest={latest} />
          )}
          {tab === "broomstick" && selectedWell && (
            <BroomstickView wellId={selectedWell} replayIndex={replayIndex} />
          )}
          {tab === "surge-swab" && <SurgeSwabView history={history} />}
          {tab === "rig-state" && <RigStateTimeline history={history} />}
          {tab === "quality" && (
            <DataQualityView latest={latest} history={history} />
          )}
          {tab === "heatmaps" && <HeatmapView history={history} />}
        </div>

        {/* Right sidebar – rig-state widget */}
        <div style={{ width: "26%", minWidth: 240, maxWidth: 320, flexShrink: 0 }}>
          <RigStateWidget history={history} />
        </div>
      </div>
    </div>
  );
}
