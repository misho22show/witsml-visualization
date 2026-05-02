import { useCallback, useEffect, useRef, useState } from "react";
import { StreamPayload } from "../utils/types";
import { wsUrl } from "../utils/api";

const MAX_HISTORY = 2000;
const FLUSH_INTERVAL_MS = 50; // batch WebSocket messages every 50ms for smooth updates

export function useWitsmlStream(wellId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [latest, setLatest] = useState<StreamPayload | null>(null);
  const [history, setHistory] = useState<StreamPayload[]>([]);

  // Buffer incoming messages and flush periodically to reduce React re-renders
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
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { connected, latest, history, clearHistory, reconnect: connect };
}
