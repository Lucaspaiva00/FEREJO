import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

type RealtimeEvent = {
  type: "tasks" | "categories" | "metrics" | "campaigns" | "settings";
  tenantId: number;
  action: "created" | "updated" | "deleted";
  data?: unknown;
};

type Listener = (event: RealtimeEvent) => void;

interface RealtimeContextValue {
  connected: boolean;
  subscribe: (listener: Listener) => () => void;
  broadcast: (event: RealtimeEvent) => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  subscribe: () => () => {},
  broadcast: () => {},
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Set<Listener>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((event: RealtimeEvent) => {
    listenersRef.current.forEach((l) => l(event));
  }, []);

  const connect = useCallback(() => {
    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${proto}//${window.location.host}/api/ws`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as RealtimeEvent;
          notify(event);
        } catch {}
      };
    } catch {
      reconnectTimerRef.current = setTimeout(connect, 3000);
    }
  }, [notify]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const broadcast = useCallback((event: RealtimeEvent) => {
    // Optimistic local broadcast
    notify(event);
    // Also send to server for other clients
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, [notify]);

  return (
    <RealtimeContext.Provider value={{ connected, subscribe, broadcast }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
