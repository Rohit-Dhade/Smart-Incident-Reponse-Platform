import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError, isAbortError } from "../api";
import { AppHeader } from "../components/AppHeader";
import { AssignmentPanel } from "../components/AssignmentPanel";
import { EmptyState, Notice } from "../components/Feedback";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  GlobeIcon,
  LockIcon,
  RefreshIcon,
} from "../components/Icons";
import {
  PostmortemPanel,
} from "../components/PostmortemPanel";
import {
  StatusUpdatePanel,
  UpdateComposer,
} from "../components/IncidentActions";
import { IncidentTimeline } from "../components/IncidentTimeline";
import {
  IncidentStatusBadge,
  SeverityBadge,
} from "../components/Pills";
import { canRespond } from "../constants";
import { formatDateTime, formatDuration, pluralize } from "../format";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../auth/AuthContext";
import type {
  Incident,
  IncidentUpdate,
  Postmortem,
  Service,
} from "../types";

interface LoadError {
  message: string;
  status?: number;
}

export function IncidentPage() {
  const { session } = useAuth();
  const { id = "" } = useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [postmortem, setPostmortem] = useState<Postmortem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  usePageTitle(
    incident
      ? incident.title
      : loadError
        ? loadError.status === 404
          ? "Incident not found"
          : "Incident unavailable"
        : "Incident",
  );

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!id) {
      setLoadError({ message: "Incident not found", status: 404 });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setLoadError(null);

    const load = async () => {
      try {
        const [incidentData, servicesData] = await Promise.all([
          api<Incident>(`/api/v1/incidents/${id}`, {
            signal: controller.signal,
          }),
          api<Service[]>("/api/v1/services", {
            signal: controller.signal,
          }),
        ]);

        const postmortemPromise = api<Postmortem>(
          `/api/v1/incidents/${id}/postmortem`,
          { signal: controller.signal },
        ).catch((cause: unknown) => {
          if (cause instanceof ApiError && cause.status === 404) return null;
          throw cause;
        });

        const updatesPromise = api<IncidentUpdate[]>(
          `/api/v1/incidents/${id}/updates`,
          { signal: controller.signal },
        ).catch((cause: unknown) => {
          if (cause instanceof ApiError && cause.status === 404) return [];
          throw cause;
        });

        const [updatesData, postmortemData] = await Promise.all([
          updatesPromise,
          postmortemPromise,
        ]);

        if (!active) return;
        setIncident(incidentData);
        setServices(servicesData);
        setUpdates(updatesData);
        setPostmortem(postmortemData);
      } catch (cause) {
        if (!active || isAbortError(cause)) return;
        setLoadError({
          message:
            cause instanceof Error
              ? cause.message
              : "Unable to load this incident.",
          status: cause instanceof ApiError ? cause.status : undefined,
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, reloadKey]);

  const refreshTimeline = useCallback(async () => {
    if (!id) return;
    try {
      const nextUpdates = await api<IncidentUpdate[]>(
        `/api/v1/incidents/${id}/updates`,
      );
      setUpdates(nextUpdates);
      setActionError("");
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? `Could not refresh the timeline: ${cause.message}`
          : "Could not refresh the timeline.",
      );
    }
  }, [id]);

  const refreshServices = useCallback(async () => {
    try {
      const nextServices = await api<Service[]>("/api/v1/services");
      setServices(nextServices);
    } catch {
      /* The service name stays visible from the last successful load. */
    }
  }, []);

  const handleIncidentUpdated = (updated: Incident) => {
    setIncident(updated);
    void refreshTimeline();
    void refreshServices();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [updatedIncident] = await Promise.all([
        api<Incident>(`/api/v1/incidents/${id}`),
        refreshTimeline(),
        refreshServices(),
      ]);
      setIncident(updatedIncident);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not refresh the incident.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const serviceNames = useMemo(
    () => new Map(services.map((service) => [service._id, service.name])),
    [services],
  );

  if (!session) return null;

  if (loading && !incident) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main
          id="main"
          className="container incident-loading"
          role="status"
          aria-live="polite"
          tabIndex={-1}
        >
          <span className="page-loader__spinner" aria-hidden="true" />
          <span>Loading incident&hellip;</span>
        </main>
      </div>
    );
  }

  if (loadError || !incident) {
    const notFound = loadError?.status === 404;
    return (
      <div className="app-shell">
        <AppHeader />
        <main id="main" tabIndex={-1} className="container page-state">
          <EmptyState
            title={notFound ? "Incident not found" : "Could not load incident"}
            description={
              loadError?.message ??
              "This incident may have been removed or belongs to another workspace."
            }
            headingLevel="h1"
            action={
              <div className="page-state__actions">
                {!notFound ? (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setReloadKey((key) => key + 1)}
                  >
                    Try again
                  </button>
                ) : null}
                <Link className="btn btn--secondary" to="/dashboard">
                  <ArrowLeftIcon size={16} />
                  Back to dashboard
                </Link>
              </div>
            }
          />
        </main>
      </div>
    );
  }

  const serviceName =
    serviceNames.get(incident.serviceId) ?? "Unknown service";
  const canAct = canRespond(session.role);
  const isAdmin = session.role === "admin";
  const publicUpdates = updates.filter(
    (update) => update.visibility === "public",
  );
  const publicUrl =
    publicUpdates.length > 0
      ? `/status/${session.organization.slug}#incident-${incident._id}`
      : `/status/${session.organization.slug}`;
  const duration = incident.resolvedAt
    ? formatDuration(incident.createdAt, incident.resolvedAt)
    : formatDuration(incident.createdAt);

  return (
    <div className="app-shell">
      <AppHeader />
      <main id="main" tabIndex={-1} className="container incident-page">
        <Link className="back-link" to="/dashboard">
          <ArrowLeftIcon size={16} />
          All incidents
        </Link>

        <header className="incident-heading">
          <div className="incident-heading__main">
            <div className="incident-heading__badges">
              <SeverityBadge severity={incident.severity} />
              <IncidentStatusBadge status={incident.status} />
            </div>
            <h1 className="incident-heading__title">{incident.title}</h1>
            <p className="incident-heading__meta">
              <span>{serviceName}</span>
              <span aria-hidden="true">&middot;</span>
              <span>
                Opened{" "}
                <time
                  dateTime={incident.createdAt}
                  title={formatDateTime(incident.createdAt)}
                >
                  {formatDateTime(incident.createdAt)}
                </time>
              </span>
              {incident.resolvedAt ? (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>
                    Resolved{" "}
                    <time
                      dateTime={incident.resolvedAt}
                      title={formatDateTime(incident.resolvedAt)}
                    >
                      {formatDateTime(incident.resolvedAt)}
                    </time>
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div className="incident-heading__actions">
            <a
              className="btn btn--secondary btn--sm"
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
            >
              <GlobeIcon size={15} />
              Public status page
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </header>

        {actionError ? (
          <Notice tone="error" onDismiss={() => setActionError("")}>
            {actionError}
          </Notice>
        ) : null}

        {notice ? (
          <Notice tone="success" onDismiss={() => setNotice("")}>
            {notice}
          </Notice>
        ) : null}

        <div className="incident-layout">
          <div className="incident-main">
            <section
              className="panel incident-description"
              aria-labelledby="description-heading"
            >
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Summary</p>
                  <h2 id="description-heading">Description</h2>
                </div>
              </div>
              <div className="panel__body">
                {incident.description ? (
                  <p className="incident-description__text">
                    {incident.description}
                  </p>
                ) : (
                  <p className="is-empty">
                    No description was added when this incident was opened.
                  </p>
                )}
              </div>
            </section>

            <section
              className="panel timeline-panel"
              aria-labelledby="timeline-heading"
            >
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Record</p>
                  <h2 id="timeline-heading">Timeline</h2>
                </div>
                <div className="timeline-panel__tools">
                  <span className="panel__meta">
                    {pluralize(updates.length, "entry", "entries")}
                  </span>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => void handleRefresh()}
                    disabled={refreshing}
                    aria-label="Refresh incident timeline"
                    title="Refresh incident"
                  >
                    <RefreshIcon size={16} />
                  </button>
                </div>
              </div>
              <div className="panel__body">
                <IncidentTimeline updates={updates} />
              </div>
            </section>

            <PostmortemPanel
              incident={incident}
              postmortem={postmortem}
              canDraft={canAct}
              isAdmin={isAdmin}
              onChanged={(next) => setPostmortem(next)}
              onNotice={setNotice}
            />
          </div>

          <aside className="incident-sidebar" aria-label="Incident actions and details">
            <section className="panel side-panel meta-panel" aria-labelledby="details-heading">
              <div className="side-panel__header">
                <span className="side-panel__icon" aria-hidden="true">
                  <ClockIcon size={18} />
                </span>
                <div>
                  <h2 id="details-heading">Incident details</h2>
                  <p>Current record and service context.</p>
                </div>
              </div>
              <dl className="meta-list">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <IncidentStatusBadge status={incident.status} />
                  </dd>
                </div>
                <div>
                  <dt>Service</dt>
                  <dd>{serviceName}</dd>
                </div>
                <div>
                  <dt>Severity</dt>
                  <dd>
                    <SeverityBadge severity={incident.severity} />
                  </dd>
                </div>
                <div>
                  <dt>Opened</dt>
                  <dd>{formatDateTime(incident.createdAt)}</dd>
                </div>
                <div>
                  <dt>{incident.resolvedAt ? "Resolved" : "Open for"}</dt>
                  <dd>
                    {incident.resolvedAt
                      ? formatDateTime(incident.resolvedAt)
                      : duration}
                  </dd>
                </div>
                {incident.resolvedAt ? (
                  <div>
                    <dt>Duration</dt>
                    <dd>{duration}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Assigned</dt>
                  <dd>
                    {incident.assignedTo.length > 0
                      ? pluralize(incident.assignedTo.length, "responder")
                      : "Unassigned"}
                  </dd>
                </div>
              </dl>

              <div className="meta-public">
                <span className="meta-public__icon" aria-hidden="true">
                  <GlobeIcon size={17} />
                </span>
                <div>
                  <span className="meta-public__title">Public updates</span>
                  <span className="meta-public__sub">
                    {publicUpdates.length > 0
                      ? pluralize(publicUpdates.length, "update") +
                        " visible on the status page"
                      : "No customer-facing updates yet"}
                  </span>
                </div>
                <a
                  className="meta-public__link"
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                  <ArrowRightIcon size={14} />
                  <span className="sr-only"> public status page in a new tab</span>
                </a>
              </div>
            </section>

            {canAct ? (
              <>
                <AssignmentPanel
                  incident={incident}
                  onUpdated={handleIncidentUpdated}
                  onNotice={setNotice}
                />
                <StatusUpdatePanel
                  incident={incident}
                  onUpdated={handleIncidentUpdated}
                  onNotice={setNotice}
                />
                <UpdateComposer
                  incidentId={incident._id}
                  onPosted={refreshTimeline}
                  onNotice={setNotice}
                />
              </>
            ) : (
              <section className="panel side-panel view-only-panel">
                <div className="side-panel__header">
                  <span className="side-panel__icon" aria-hidden="true">
                    <LockIcon size={18} />
                  </span>
                  <div>
                    <h2>View-only access</h2>
                    <p>
                      Your viewer role can follow this incident but cannot
                      change its status or post updates.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
