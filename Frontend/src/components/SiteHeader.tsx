import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "./Brand";

export function SiteHeader() {
  const { session, status } = useAuth();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand />
        <nav className="site-nav" aria-label="Primary">
          {session && status === "ready" ? (
            <Link className="btn btn--secondary btn--sm" to="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                Sign in
              </Link>
              <Link className="btn btn--primary btn--sm" to="/register">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
