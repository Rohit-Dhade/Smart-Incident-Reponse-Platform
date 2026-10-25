import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { createSocket } from "../socket";
import type { Incident, Service } from "../types";

interface WorkspaceData {
  incidents: Incident[];
  services: Service[];
  loading: boolean;
  error: string;
  live: boolean;
  reload: (options?: { silent?: boolean }) => Promise<void>;
}

export function useWorkspaceData(): WorkspaceData {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setLoading(true);
    }
    try {
      const [nextIncidents, nextServices] = await Promise.all([
        api<Incident[]>("/api/v1/incidents", { method: "GET" }),
        api<Service[]>("/api/v1/services", { method: "GET" }),
      ]);
      if (!mountedRef.current) return;
      setIncidents(nextIncidents);
      setServices(nextServices);
      setError("");
      loadedRef.current = true;
    } catch (cause) {
      if (!mountedRef.current) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load workspace data.",
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    const socket = createSocket();

    const refresh = () => {
      void reloadRef.current({ silent: true });
    };

    socket.on("connect", () => {
      setLive(true);
      refresh();
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("connect_error", () => setLive(false));
    socket.on("incident:created", refresh);
    socket.on("incident:updated", refresh);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setLive(false);
    };
  }, []);

  useEffect(() => {
    if (live || !loadedRef.current) return;
    const interval = window.setInterval(() => {
      void reloadRef.current({ silent: true });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [live, loading]);

  return { incidents, services, loading, error, live, reload };
}
