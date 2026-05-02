import { useCallback, useEffect, useRef, useState } from "react";
import { AccumulatedData, BroomstickBinAcc, StreamPayload } from "../utils/types";

import { wsUrl } from "../utils/api";

const MAX_HISTORY = 2000;
const FLUSH_INTERVAL_MS = 50;
const BROOMSTICK_BIN_SIZE = 5.0;
const HEATMAP_DEPTH_BIN = 5;
const MAX_SURGE_EVENTS = 500;
const MAX_HEATMAP_POINTS = 4000;

const ROTATION_STATES = new Set(["Drilling", "Rotating Off-Bottom", "Reaming"]);

function createEmptyAccumulated(): AccumulatedData {
  return {
    broomstickBins: {},
    broomstickPrevDepth: null,
    rigStateCounts: {},
    surgeEvents: [],
    detectedEvents: [],
    heatmapTorque: [],
    heatmapHookload: [],
    timeAtDepthBins: {},
    totalProcessed: 0,
  };
}

function ensureBin(bins: Record<number, BroomstickBinAcc>, key: number): BroomstickBinAcc {
  if (!bins[key]) {
    bins[key] = {
      pickup_sum: 0, pickup_count: 0,
      slackoff_sum: 0, slackoff_count: 0,
      rotation_sum: 0, rotation_count: 0,
      torque_sum: 0, torque_count: 0,
    };
  }
  return bins[key];
}

function accumulatePayload(acc: AccumulatedData, p: StreamPayload): void {
  const rec = p.record;
  const depth = rec.measured_depth ?? rec.block_position;

  // Broomstick accumulation
  if (depth != null && rec.hookload != null) {
    const binKey = Math.round(depth / BROOMSTICK_BIN_SIZE) * BROOMSTICK_BIN_SIZE;
    const bin = ensureBin(acc.broomstickBins, binKey);

    let depthDelta = 0;
    if (acc.broomstickPrevDepth != null) {
      depthDelta = depth - acc.broomstickPrevDepth;
    }
    acc.broomstickPrevDepth = depth;

    if (depthDelta < -0.01) {
      bin.pickup_sum += rec.hookload;
      bin.pickup_count++;
    } else if (depthDelta > 0.01) {
      bin.slackoff_sum += rec.hookload;
      bin.slackoff_count++;
    }

    const state = p.rig_state?.state ?? "";
    if (ROTATION_STATES.has(state)) {
      bin.rotation_sum += rec.hookload;
      bin.rotation_count++;
      if (rec.surface_torque != null) {
        bin.torque_sum += rec.surface_torque;
        bin.torque_count++;
      }
    }
  }

  // Rig state counts
  const state = p.rig_state?.state ?? "Unknown";
  acc.rigStateCounts[state] = (acc.rigStateCounts[state] || 0) + 1;

  // Surge/swab events
  if (
    p.surge_swab &&
    p.surge_swab.condition !== "Neutral" &&
    p.surge_swab.condition !== "Unclassified"
  ) {
    acc.surgeEvents.push(p.surge_swab);
    if (acc.surgeEvents.length > MAX_SURGE_EVENTS) {
      acc.surgeEvents = acc.surgeEvents.slice(-MAX_SURGE_EVENTS);
    }
  }

  // Detected events
  for (const e of p.events) {
    acc.detectedEvents.push(e);
  }

  // Heatmap data
  if (depth != null) {
    if (rec.surface_torque != null) {
      acc.heatmapTorque.push({ depth, torque: rec.surface_torque });
      if (acc.heatmapTorque.length > MAX_HEATMAP_POINTS) {
        acc.heatmapTorque = acc.heatmapTorque.slice(-MAX_HEATMAP_POINTS);
      }
    }
    if (rec.hookload != null) {
      acc.heatmapHookload.push({ depth, hookload: rec.hookload });
      if (acc.heatmapHookload.length > MAX_HEATMAP_POINTS) {
        acc.heatmapHookload = acc.heatmapHookload.slice(-MAX_HEATMAP_POINTS);
      }
    }
    const dBin = Math.round(depth / HEATMAP_DEPTH_BIN) * HEATMAP_DEPTH_BIN;
    acc.timeAtDepthBins[dBin] = (acc.timeAtDepthBins[dBin] || 0) + 1;
  }

  acc.totalProcessed++;
}

export function useWitsmlStream(wellId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [latest, setLatest] = useState<StreamPayload | null>(null);
  const [history, setHistory] = useState<StreamPayload[]>([]);

  // Accumulated data that never gets trimmed (aggregated, bounded)
  const accRef = useRef<AccumulatedData>(createEmptyAccumulated());
  const [accVersion, setAccVersion] = useState(0);

  const bufferRef = useRef<StreamPayload[]>([]);
  const latestRef = useRef<StreamPayload | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startFlushing = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setInterval(() => {
      const batch = bufferRef.current;
      const lat = latestRef.current;
      if (batch.length === 0) return;
      bufferRef.current = [];

      // Process batch into accumulated data BEFORE capping
      for (const p of batch) {
        accumulatePayload(accRef.current, p);
      }
      setAccVersion((v) => v + 1);

      setHistory((prev) => {
        const combined = prev.concat(batch);
        return combined.length > MAX_HISTORY
          ? combined.slice(combined.length - MAX_HISTORY)
          : combined;
      });
      if (lat) setLatest(lat);
    }, FLUSH_INTERVAL_MS);
  }, []);

  const stopFlushing = useCallback(() => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!wellId) return;
    const ws = new WebSocket(wsUrl(`/stream/${wellId}`));
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      startFlushing();
    };
    ws.onclose = () => {
      setConnected(false);
      stopFlushing();
    };
    ws.onerror = () => {
      setConnected(false);
      stopFlushing();
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.record) {
          const payload = data as StreamPayload;
          bufferRef.current.push(payload);
          latestRef.current = payload;
        }
      } catch {
        // ignore non-JSON
      }
    };
  }, [wellId, startFlushing, stopFlushing]);

  const disconnect = useCallback(() => {
    stopFlushing();
    wsRef.current?.close();
    wsRef.current = null;
  }, [stopFlushing]);

  const clearHistory = useCallback(() => {
    bufferRef.current = [];
    latestRef.current = null;
    setHistory([]);
    setLatest(null);
    accRef.current = createEmptyAccumulated();
    setAccVersion(0);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    connected,
    latest,
    history,
    accumulated: accRef.current,
    accVersion,
    clearHistory,
    reconnect: connect,
  };
}
