import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, isAbortError } from "../api";
import { createSocket } from "../socket";
import type { PublicStatus } from "../types";

interface SubscribeAck {
  ok?: boolean;
  data?: PublicStatus;
  error?: string;
}

interface PublicStatusState {
  data: PublicStatus | null;
  loading: boolean;
  error: string;
  notFound: boolean;
  live: boolean;
  lastUpdated: Date | null;
  retry: () => void;
}

export function usePublicStatus(slug: string): PublicStatusState {
  const [data, setData] = useState<PublicStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [requestKey, setRequestKey] = useState(0);
  const mountedRef = useRef(true);

  const retry = useCallback(() => {
    setRequestKey((key) => key + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyData = useCallback((next: PublicStatus) => {
    if (!mountedRef.current) return;
    setData(next);
    setError("");
    setNotFound(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError("");
    setNotFound(false);

    api<PublicStatus>(
      `/api/v1/status/${encodeURIComponent(slug)}`,
      { signal: controller.signal },
      { suppressAuthEvent: true },
    )
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setLastUpdated(new Date());
      })
      .catch((cause: unknown) => {
        if (!active || isAbortError(cause)) return;
        if (cause instanceof ApiError && cause.status === 404) {
          setNotFound(true);
        } else {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load this status page.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [slug, requestKey]);

  useEffect(() => {
    if (loading || notFound) return;

    const socket = createSocket("/public");

    const subscribe = () => {
      socket.emit(
        "subscribe",
        slug,
        (ack: SubscribeAck | undefined) => {
          if (!mountedRef.current) return;
          if (ack?.ok && ack.data) {
            applyData(ack.data);
            setLive(true);
          } else {
            setLive(false);
          }
        },
      );
    };

    socket.on("connect", subscribe);
    socket.on("disconnect", () => setLive(false));
    socket.on("connect_error", () => setLive(false));
    socket.on("status:snapshot", (snapshot: PublicStatus) => {
      applyData(snapshot);
      setLive(true);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setLive(false);
    };
  }, [slug, loading, notFound, applyData]);

  useEffect(() => {
    if (loading || live || notFound) return;

    const interval = window.setInterval(() => {
      api<PublicStatus>(
        `/api/v1/status/${encodeURIComponent(slug)}`,
        {},
        { suppressAuthEvent: true },
      )
        .then(applyData)
        .catch(() => {
          /* Keep the last known snapshot while polling. */
        });
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [slug, loading, live, notFound, applyData]);

  return {
    data,
    loading,
    error,
    notFound,
    live,
    lastUpdated,
    retry,
  };
}
