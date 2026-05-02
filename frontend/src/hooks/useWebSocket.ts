import { useCallback, useEffect, useRef, useState } from "react";
import { StreamPayload } from "../utils/types";
import { wsUrl } from "../utils/api";

export function useWitsmlStream(wellId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [latest, setLatest] = useState<StreamPayload | null>(null);
  const [history, setHistory] = useState<StreamPayload[]>([]);

  const connect = useCallback(() => {
    if (!wellId) return;
    const ws = new WebSocket(wsUrl(`/stream/${wellId}`));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.record) {
          setLatest(data as StreamPayload);
          setHistory((prev) => [...prev, data as StreamPayload]);
        }
      } catch {
        // ignore non-JSON
      }
    };
  }, [wellId]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLatest(null);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { connected, latest, history, clearHistory, reconnect: connect };
}
