import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS } from "../constants";
import { getInitials } from "../format";
import { Brand } from "./Brand";
import { ExternalLinkIcon } from "./Icons";

export function AppHeader() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!session) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="app-header">
      <div className="container app-header__inner">
        <div className="app-header__brand-group">
          <Brand to="/dashboard" />
          <span className="app-header__divider" aria-hidden="true" />
          <span className="app-header__org" title={session.organization.name}>
            {session.organization.name}
          </span>
        </div>

        <div className="app-header__actions">
          <Link
            className="btn btn--secondary btn--sm app-header__status-link"
            to={`/status/${session.organization.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLinkIcon size={15} />
            <span className="app-header__status-label">Status page</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>

          <div className="user-chip">
            <span className="avatar" aria-hidden="true">
              {getInitials(session.user.name)}
            </span>
            <span className="user-chip__text">
              <span className="user-chip__name">{session.user.name}</span>
              <span className="user-chip__role">
                {ROLE_LABELS[session.role]}
              </span>
            </span>
          </div>

          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
