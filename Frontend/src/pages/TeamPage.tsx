import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiAction } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AppHeader } from "../components/AppHeader";
import { EmptyState, Notice } from "../components/Feedback";
import { InviteEmployeeDialog } from "../components/InviteEmployeeDialog";
import {
  CheckIcon,
  PlusIcon,
  RefreshIcon,
  UsersIcon,
} from "../components/Icons";
import { ROLE_LABELS } from "../constants";
import { formatDateTime, getInitials, pluralize } from "../format";
import { usePageTitle } from "../hooks/usePageTitle";
import type {
  CreatedInvitation,
  PendingInvitation,
  TeamMember,
} from "../types";

export function TeamPage() {
  usePageTitle("Team");
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [latestInvite, setLatestInvite] = useState<CreatedInvitation | null>(
    null,
  );
  const [revokingId, setRevokingId] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const inviteInputRef = useRef<HTMLInputElement>(null);

  const loadTeam = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) setLoading(true);
      try {
        const memberRequest = api<TeamMember[]>("/api/v1/members", {
          method: "GET",
        });
        const invitationRequest = isAdmin
          ? api<PendingInvitation[]>("/api/v1/invitations", { method: "GET" })
          : Promise.resolve([] as PendingInvitation[]);

        const [nextMembers, nextInvitations] = await Promise.all([
          memberRequest,
          invitationRequest,
        ]);

        setMembers(nextMembers);
        if (isAdmin) setInvitations(nextInvitations);
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load your team.",
        );
      } finally {
        setLoading(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!latestInvite) return;
    const frame = window.requestAnimationFrame(() =>
      inviteInputRef.current?.focus(),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [latestInvite]);

  if (!session) return null;

  const handleInviteCreated = (invitation: CreatedInvitation) => {
    setInviteOpen(false);
    setLatestInvite(invitation);
    setCopied(false);
    setCopyError("");
    void loadTeam({ silent: true });
  };

  const handleCopyLink = async () => {
    if (!latestInvite) return;
    try {
      await navigator.clipboard.writeText(latestInvite.inviteLink);
      setCopied(true);
      setCopyError("");
    } catch {
      const input = inviteInputRef.current;
      let copiedFromSelection = false;
      if (input) {
        input.focus();
        input.select();
        try {
          copiedFromSelection = document.execCommand("copy");
        } catch {
          copiedFromSelection = false;
        }
      }

      if (copiedFromSelection) {
        setCopied(true);
        setCopyError("");
      } else {
        setCopyError(
          "Copying was blocked by the browser. Select the link and copy it manually.",
        );
      }
    }
  };

  const handleRevoke = async (invitation: PendingInvitation) => {
    setError("");
    setRevokingId(invitation._id);
    try {
      await apiAction(`/api/v1/invitations/${invitation._id}`, {
        method: "DELETE",
      });
      setInvitations((current) =>
        current.filter((item) => item._id !== invitation._id),
      );
      setNotice(`Invitation for ${invitation.email} revoked.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to revoke this invitation.",
      );
    } finally {
      setRevokingId("");
    }
  };

  return (
    <div className="app-shell">
      <AppHeader />
      <main id="main" tabIndex={-1} className="container team-page">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="page-heading__title">Team</h1>
            <p className="page-heading__lede">
              Everyone who can access {session.organization.name}, plus the
              invitations waiting to be accepted.
            </p>
          </div>
          <div className="page-heading__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => void loadTeam({ silent: true })}
              disabled={loading}
            >
              <RefreshIcon size={16} />
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            {isAdmin ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setInviteOpen(true)}
              >
                <PlusIcon size={16} />
                Invite employee
              </button>
            ) : null}
          </div>
        </header>

        {error ? (
          <Notice tone="error">
            {error}{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => void loadTeam()}
            >
              Try again
            </button>
          </Notice>
        ) : null}

        {notice ? (
          <Notice tone="success" onDismiss={() => setNotice("")}>
            {notice}
          </Notice>
        ) : null}

        {latestInvite ? (
          <section
            className="invite-banner"
            aria-labelledby="invite-banner-heading"
          >
            <div className="invite-banner__header">
              <div>
                <p className="eyebrow">Invitation ready</p>
                <h2 id="invite-banner-heading">
                  Share this link with {latestInvite.email}
                </h2>
                <p>
                  Email delivery is not set up yet. Copy this one-time link and
                  send it directly. It expires{" "}
                  {formatDateTime(latestInvite.expiresAt)}.
                </p>
              </div>
              <button
                type="button"
                className="link-button"
                onClick={() => setLatestInvite(null)}
              >
                Dismiss
              </button>
            </div>

            <div className="invite-banner__link">
              <label className="sr-only" htmlFor="invite-link">
                Invitation link
              </label>
              <input
                id="invite-link"
                ref={inviteInputRef}
                className="input invite-banner__input"
                value={latestInvite.inviteLink}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void handleCopyLink()}
              >
                {copied ? <CheckIcon size={16} /> : null}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            {copyError ? (
              <p className="invite-banner__error" role="alert">
                {copyError}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className={`team-grid ${isAdmin ? "" : "team-grid--single"}`}>
          <section className="panel team-panel" aria-labelledby="members-heading">
            <div className="panel__header team-panel__header">
              <div>
                <p className="eyebrow">Directory</p>
                <h2 id="members-heading">Members</h2>
              </div>
              <span className="team-panel__meta">
                {loading && members.length === 0
                  ? "Loading…"
                  : pluralize(members.length, "member")}
              </span>
            </div>

            <div className="team-panel__body">
              {loading && members.length === 0 ? (
                <div className="team-loading" role="status">
                  <span className="page-loader__spinner" aria-hidden="true" />
                  Loading your team…
                </div>
              ) : members.length === 0 ? (
                <EmptyState
                  icon={<UsersIcon size={24} />}
                  title="No members yet"
                  description="This workspace does not have any members to show."
                />
              ) : (
                <ul className="team-member-list" aria-label="Workspace members">
                  {members.map((member) => {
                    const isYou = member.userId === session.user.id;
                    return (
                      <li className="team-member" key={member.userId}>
                        <span
                          className="avatar team-member__avatar"
                          aria-hidden="true"
                        >
                          {getInitials(member.name)}
                        </span>
                        <div className="team-member__body">
                          <span className="team-member__name">
                            {member.name}
                            {isYou ? (
                              <span className="team-member__you">You</span>
                            ) : null}
                          </span>
                          <span className="team-member__email">
                            {member.email}
                          </span>
                        </div>
                        <span className={`pill pill--role-${member.role}`}>
                          {ROLE_LABELS[member.role]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {isAdmin ? (
            <section
              className="panel team-panel"
              aria-labelledby="invitations-heading"
            >
              <div className="panel__header team-panel__header">
                <div>
                  <p className="eyebrow">Pending</p>
                  <h2 id="invitations-heading">Invitations</h2>
                </div>
                <span className="team-panel__meta">
                  {loading && invitations.length === 0
                    ? "Loading…"
                    : pluralize(invitations.length, "invitation")}
                </span>
              </div>

              <div className="team-panel__body">
                {loading && invitations.length === 0 ? (
                  <div className="team-loading" role="status">
                    <span
                      className="page-loader__spinner"
                      aria-hidden="true"
                    />
                    Loading invitations…
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="team-empty">
                    <span className="team-empty__icon" aria-hidden="true">
                      <UsersIcon size={20} />
                    </span>
                    <h3>No pending invitations</h3>
                    <p>
                      Invite a teammate to give them access to incidents and
                      status updates.
                    </p>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => setInviteOpen(true)}
                    >
                      <PlusIcon size={15} />
                      Invite employee
                    </button>
                  </div>
                ) : (
                  <ul
                    className="invite-list"
                    aria-label="Pending invitations"
                  >
                    {invitations.map((invitation) => (
                      <li className="invite-row" key={invitation._id}>
                        <div className="invite-row__body">
                          <span className="invite-row__email">
                            {invitation.email}
                          </span>
                          <span className="invite-row__meta">
                            {ROLE_LABELS[invitation.role]} · Expires{" "}
                            {formatDateTime(invitation.expiresAt)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn--quiet btn--sm invite-row__revoke"
                          onClick={() => void handleRevoke(invitation)}
                          disabled={Boolean(revokingId)}
                          aria-label={`Revoke invitation for ${invitation.email}`}
                        >
                          {revokingId === invitation._id
                            ? "Revoking…"
                            : "Revoke"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <p className="team-footnote">
          {isAdmin
            ? "Invitations expire after seven days. Only admins can create or revoke them."
            : "Only workspace admins can invite or revoke teammates."}
        </p>
      </main>

      <InviteEmployeeDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={handleInviteCreated}
      />
    </div>
  );
}
