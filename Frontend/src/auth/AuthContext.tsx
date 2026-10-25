import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  apiAction,
  isAbortError,
  UNAUTHORIZED_EVENT,
} from "../api";
import type { Session } from "../types";

type AuthStatus = "loading" | "ready";

interface AuthContextValue {
  session: Session | null;
  status: AuthStatus;
  refresh: () => Promise<Session | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const nextSession = await api<Session>(
        "/api/v1/auth/me",
        { method: "GET" },
        { suppressAuthEvent: true },
      );
      setSession(nextSession);
      return nextSession;
    } catch (error) {
      if (!isAbortError(error)) {
        setSession(null);
      }
      return null;
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUnauthorized = () => setSession(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiAction("/api/v1/auth/logout", { method: "POST" });
    } finally {
      setSession(null);
    }
  }, []);

  const value = useMemo(
    () => ({ session, status, refresh, signOut }),
    [session, status, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
