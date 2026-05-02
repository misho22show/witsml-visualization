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

const NAV: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: "8px 16px",
  background: "#141820",
  borderBottom: "1px solid #2d3748",
};

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
    <div style={{ minHeight: "100vh", background: "#0f1419" }}>
      {/* Header */}
      <header
        style={{
          padding: "12px 16px",
          background: "#141820",
          borderBottom: "1px solid #2d3748",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#38b2ac" }}>
          WITSML Visualization
        </h1>

        {/* Well selector */}
        <select
          value={selectedWell ?? ""}
          onChange={(e) => {
            setSelectedWell(e.target.value);
            clearHistory();
          }}
          style={{
            padding: "5px 10px",
            background: "#1a1f2e",
            color: "#e2e8f0",
            border: "1px solid #4a5568",
            borderRadius: 4,
            fontSize: 13,
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
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 4,
            background: connected ? "#38b2ac" : "#e53e3e",
            color: "#fff",
          }}
        >
          {connected ? "Connected" : "Disconnected"}
        </span>
      </header>

      {/* Tabs */}
      <nav style={NAV}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: tab === t.id ? "#38b2ac" : "transparent",
              color: tab === t.id ? "#fff" : "#a0aec0",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Body */}
      <div style={{ display: "flex", padding: 16, gap: 16 }}>
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
        <div style={{ width: "28%", minWidth: 260, flexShrink: 0 }}>
          <RigStateWidget history={history} />
        </div>
      </div>
    </div>
  );
}
