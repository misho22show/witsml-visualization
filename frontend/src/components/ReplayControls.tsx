import React, { useCallback, useEffect, useState } from "react";
import { postJSON } from "../utils/api";

interface Props {
  wellId: string;
  replayIndex: number;
  totalRecords: number;
  onReset: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    background: "#1a1f2e",
    borderRadius: 8,
    marginBottom: 16,
  },
  btn: {
    padding: "6px 16px",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  progress: {
    flex: 1,
    height: 6,
    background: "#2d3748",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    background: "linear-gradient(90deg, #38b2ac, #48bb78)",
    borderRadius: 3,
    transition: "width 0.15s",
  },
  label: { fontSize: 12, color: "#a0aec0", minWidth: 90, textAlign: "right" as const },
  speedBtn: {
    padding: "4px 10px",
    border: "1px solid #4a5568",
    borderRadius: 4,
    background: "transparent",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 12,
  },
};

const SPEEDS = [0.5, 1, 2, 5, 10];

export default function ReplayControls({ wellId, replayIndex, totalRecords, onReset }: Props) {
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(() => {
    postJSON(`/replay/start?well_id=${wellId}`);
    setPlaying(true);
  }, [wellId]);

  const pause = useCallback(() => {
    postJSON(`/replay/pause?well_id=${wellId}`);
    setPlaying(false);
  }, [wellId]);

  const reset = useCallback(async () => {
    await postJSON(`/replay/reset?well_id=${wellId}`);
    setPlaying(false);
    onReset();
  }, [wellId, onReset]);

  const changeSpeed = useCallback(async (s: number) => {
    setSpeed(s);
    await postJSON(`/settings/playback-speed?speed=${s}`);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          playing ? pause() : start();
          break;
        case "r":
          if (!e.ctrlKey && !e.metaKey) reset();
          break;
        case "+":
        case "=": {
          const idx = SPEEDS.indexOf(speed);
          if (idx < SPEEDS.length - 1) changeSpeed(SPEEDS[idx + 1]);
          break;
        }
        case "-": {
          const idx = SPEEDS.indexOf(speed);
          if (idx > 0) changeSpeed(SPEEDS[idx - 1]);
          break;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playing, speed, start, pause, reset, changeSpeed]);

  const pct = totalRecords > 0 ? (replayIndex / totalRecords) * 100 : 0;

  return (
    <div style={styles.bar}>
      {playing ? (
        <button style={{ ...styles.btn, background: "#ed8936", color: "#fff" }} onClick={pause} title="Pause (Space)">
          ⏸ Pause
        </button>
      ) : (
        <button style={{ ...styles.btn, background: "#38b2ac", color: "#fff" }} onClick={start} title="Play (Space)">
          ▶ Play
        </button>
      )}
      <button style={{ ...styles.btn, background: "#e53e3e", color: "#fff" }} onClick={reset} title="Reset (R)">
        ⟳ Reset
      </button>

      <div style={styles.progress}>
        <div style={{ ...styles.fill, width: `${pct}%` }} />
      </div>

      <span style={styles.label}>
        {replayIndex.toLocaleString()} / {totalRecords.toLocaleString()}
      </span>

      <span style={{ fontSize: 10, color: "#4a5568" }}>|</span>

      <span style={{ fontSize: 11, color: "#718096" }}>{pct.toFixed(1)}%</span>

      <span style={{ fontSize: 10, color: "#4a5568" }}>|</span>

      <span style={{ fontSize: 12, color: "#a0aec0" }}>Speed:</span>
      {SPEEDS.map((s) => (
        <button
          key={s}
          style={{
            ...styles.speedBtn,
            background: speed === s ? "#38b2ac" : "transparent",
            color: speed === s ? "#fff" : "#e2e8f0",
          }}
          onClick={() => changeSpeed(s)}
          title={`${s}x speed (+/- to adjust)`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}
