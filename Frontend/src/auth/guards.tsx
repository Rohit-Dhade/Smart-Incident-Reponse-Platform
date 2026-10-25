import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { PageLoader } from "../components/PageLoader";

export function RequireAuth() {
  const { session, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <PageLoader label="Checking your session" />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { session, status } = useAuth();

  if (status === "loading") {
    return <PageLoader label="Checking your session" />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
