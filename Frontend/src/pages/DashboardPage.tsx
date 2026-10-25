import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AddServiceDialog } from "../components/AddServiceDialog";
import { AppHeader } from "../components/AppHeader";
import { CreateIncidentDialog } from "../components/CreateIncidentDialog";
import { EmptyState, Notice } from "../components/Feedback";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  GlobeIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
} from "../components/Icons";
import {
  IncidentStatusBadge,
  LiveBadge,
  ServiceStatusBadge,
  SeverityBadge,
} from "../components/Pills";
import { canRespond, INCIDENT_SEVERITY_RANK } from "../constants";
import {
  formatDateTime,
  pluralize,
  relativeTime,
} from "../format";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { usePageTitle } from "../hooks/usePageTitle";
import type { Incident } from "../types";

type IncidentFilter = "all" | "active" | "resolved";

const FILTERS: Array<{ value: IncidentFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
];

export function DashboardPage() {
  const { session } = useAuth();
  usePageTitle(session ? `${session.organization.name} dashboard` : "Dashboard");
  const navigate = useNavigate();
  const { incidents, services, loading, error, live, reload } =
    useWorkspaceData();

  const [filter, setFilter] = useState<IncidentFilter>("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const serviceNames = useMemo(
    () => new Map(services.map((service) => [service._id, service.name])),
    [services],
  );

  const sortedIncidents = useMemo(
    () =>
      [...incidents].sort((left, right) => {
        const leftResolved = left.status === "resolved" ? 1 : 0;
        const rightResolved = right.status === "resolved" ? 1 : 0;
        if (leftResolved !== rightResolved) return leftResolved - rightResolved;
        if (leftResolved === 0) {
          const severityDifference =
            INCIDENT_SEVERITY_RANK[left.severity] -
            INCIDENT_SEVERITY_RANK[right.severity];
          if (severityDifference !== 0) return severityDifference;
        }

        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      }),
    [incidents],
  );

  const activeIncidents = sortedIncidents.filter(
    (incident) => incident.status !== "resolved",
  );
  const resolvedRecently = sortedIncidents.filter((incident) => {
    if (!incident.resolvedAt) return false;
    return (
      Date.now() - new Date(incident.resolvedAt).getTime() <=
      7 * 24 * 60 * 60 * 1000
    );
  });
  const highPriority = activeIncidents.filter(
    (incident) =>
      incident.severity === "critical" || incident.severity === "high",
  );

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortedIncidents.filter((incident) => {
      if (filter === "active" && incident.status === "resolved") return false;
      if (filter === "resolved" && incident.status !== "resolved") return false;
      if (!normalizedQuery) return true;

      const serviceName = serviceNames.get(incident.serviceId) ?? "";
      return (
        incident.title.toLowerCase().includes(normalizedQuery) ||
        serviceName.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [sortedIncidents, filter, query, serviceNames]);

  if (!session) return null;

  const role = session.role;
  const canCreate = canRespond(role);
  const isAdmin = role === "admin";
  const hasServices = services.length > 0;
  const statsReady = !loading;
  const orgSlug = session.organization.slug;

  const handleCreatedIncident = (incident: Incident) => {
    setCreateOpen(false);
    navigate(`/incidents/${incident._id}`);
  };

  const renderIncidentContent = () => {
    if (loading && incidents.length === 0) {
      return (
        <div
          className="incident-skeleton"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading incidents</span>
          {[0, 1, 2].map((row) => (
            <div className="incident-skeleton__row" key={row}>
              <span className="skeleton skeleton--badge" />
              <span className="incident-skeleton__body">
                <span className="skeleton skeleton--title" />
                <span className="skeleton skeleton--meta" />
              </span>
              <span className="skeleton skeleton--pill" />
            </div>
          ))}
        </div>
      );
    }

    if (incidents.length === 0) {
      return (
        <EmptyState
          icon={<ActivityIcon size={24} />}
          title="No incidents yet"
          description={
            hasServices
              ? "When something goes wrong, open an incident to start the response timeline."
              : "Add a service first, then open an incident when it needs attention."
          }
          action={
            canCreate ? (
              hasServices ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusIcon size={16} />
                  Open incident
                </button>
              ) : isAdmin ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setServiceOpen(true)}
                >
                  <PlusIcon size={16} />
                  Add a service
                </button>
              ) : undefined
            ) : undefined
          }
        />
      );
    }

    if (filteredIncidents.length === 0) {
      return (
        <EmptyState
          icon={<SearchIcon size={24} />}
          title="No matching incidents"
          description="Try a different search term or switch the incident filter."
          action={
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </button>
          }
        />
      );
    }

    return (
      <ul className="incident-list">
        {filteredIncidents.map((incident) => {
          const serviceName =
            serviceNames.get(incident.serviceId) ?? "Unknown service";
          return (
            <li key={incident._id}>
              <Link
                className="incident-row"
                to={`/incidents/${incident._id}`}
                aria-label={`${incident.title}, ${serviceName}, opened ${formatDateTime(
                  incident.createdAt,
                )}`}
              >
                <span className="incident-row__severity">
                  <SeverityBadge severity={incident.severity} />
                </span>
                <span className="incident-row__body">
                  <span className="incident-row__title">
                    {incident.title}
                  </span>
                  <span className="incident-row__meta">
                    <span>{serviceName}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>
                      Opened{" "}
                      <time
                        dateTime={incident.createdAt}
                        title={formatDateTime(incident.createdAt)}
                      >
                        {relativeTime(incident.createdAt)}
                      </time>
                    </span>
                  </span>
                </span>
                <span className="incident-row__right">
                  <IncidentStatusBadge status={incident.status} />
                  <span className="incident-row__chevron" aria-hidden="true">
                    <ChevronRightIcon size={18} />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="app-shell">
      <AppHeader />
      <main id="main" tabIndex={-1} className="container dashboard">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Incident workspace</p>
            <h1 className="page-heading__title">Incident overview</h1>
            <p className="page-heading__lede">
              A live view of {session.organization.name}&rsquo;s services and
              incidents.
            </p>
          </div>
          <div className="page-heading__actions">
            {canCreate ? (
              hasServices ? (
                <>
                  {isAdmin ? (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setServiceOpen(true)}
                    >
                      <PlusIcon size={16} />
                      Add service
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setCreateOpen(true)}
                  >
                    <PlusIcon size={16} />
                    Open incident
                  </button>
                </>
              ) : isAdmin ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setServiceOpen(true)}
                >
                  <PlusIcon size={16} />
                  Add your first service
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setCreateOpen(true)}
                  title="An admin needs to add a service first."
                >
                  <PlusIcon size={16} />
                  Open incident
                </button>
              )
            ) : (
              <span className="page-heading__hint">View-only access</span>
            )}
          </div>
        </header>

        {error ? (
          <Notice tone="error">
            {error}{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => void reload()}
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

        <section className="overview-facts" aria-label="Workspace overview">
          <div className="overview-fact">
            <span className="overview-fact__label">Active incidents</span>
            <span className="overview-fact__value">
              {statsReady ? activeIncidents.length : "—"}
            </span>
            <span className="overview-fact__note">
              {activeIncidents.length === 0
                ? "Nothing open right now"
                : "Currently being worked"}
            </span>
          </div>
          <div className="overview-fact">
            <span className="overview-fact__label">High priority</span>
            <span className="overview-fact__value">
              {statsReady ? highPriority.length : "—"}
            </span>
            <span className="overview-fact__note">Critical or high severity</span>
          </div>
          <div className="overview-fact">
            <span className="overview-fact__label">Resolved</span>
            <span className="overview-fact__value">
              {statsReady ? resolvedRecently.length : "—"}
            </span>
            <span className="overview-fact__note">In the last 7 days</span>
          </div>
          <div className="overview-fact">
            <span className="overview-fact__label">Services</span>
            <span className="overview-fact__value">
              {statsReady ? services.length : "—"}
            </span>
            <span className="overview-fact__note">On the public page</span>
          </div>
        </section>

        <div className="dashboard-grid">
          <section
            className="panel dashboard-panel"
            aria-labelledby="incidents-heading"
          >
            <div className="panel__header dashboard-panel__header">
              <div>
                <p className="eyebrow">Response</p>
                <h2 id="incidents-heading">Incidents</h2>
              </div>
              <div className="dashboard-panel__tools">
                <LiveBadge live={live} />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => void reload({ silent: true })}
                  aria-label="Refresh incidents"
                  title="Refresh incidents"
                >
                  <RefreshIcon size={16} />
                </button>
              </div>
            </div>

            <div className="incident-toolbar">
              <div
                className="segmented"
                role="group"
                aria-label="Filter incidents by state"
              >
                {FILTERS.map((option) => {
                  const count =
                    option.value === "all"
                      ? incidents.length
                      : option.value === "active"
                        ? activeIncidents.length
                        : incidents.length - activeIncidents.length;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`segmented__button ${
                        filter === option.value ? "is-selected" : ""
                      }`.trim()}
                      aria-pressed={filter === option.value}
                      onClick={() => setFilter(option.value)}
                    >
                      {option.label}
                      <span className="segmented__count">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="search-field">
                <SearchIcon size={16} />
                <label className="sr-only" htmlFor="incident-search">
                  Search incidents
                </label>
                <input
                  id="incident-search"
                  className="search-field__input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search incidents"
                  type="search"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="dashboard-panel__body">
              {renderIncidentContent()}
            </div>

            {incidents.length > 0 ? (
              <div className="dashboard-panel__footer">
                Showing {filteredIncidents.length} of{" "}
                {pluralize(incidents.length, "incident")}
              </div>
            ) : null}
          </section>

          <aside
            className="panel dashboard-panel services-panel"
            aria-labelledby="services-heading"
          >
            <div className="panel__header dashboard-panel__header">
              <div>
                <p className="eyebrow">Public page</p>
                <h2 id="services-heading">Services</h2>
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setServiceOpen(true)}
                >
                  <PlusIcon size={15} />
                  Add
                </button>
              ) : null}
            </div>

            <div className="dashboard-panel__body">
              {loading && services.length === 0 ? (
                <div className="service-skeleton" role="status" aria-live="polite">
                  <span className="sr-only">Loading services</span>
                  {[0, 1, 2].map((row) => (
                    <div className="service-skeleton__row" key={row}>
                      <span className="skeleton skeleton--title" />
                      <span className="skeleton skeleton--pill" />
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <EmptyState
                  icon={<GlobeIcon size={22} />}
                  title="No services monitored"
                  description={
                    isAdmin
                      ? "Add the first service to start tracking its status publicly."
                      : "An admin can add services to the public status page."
                  }
                  action={
                    isAdmin ? (
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => setServiceOpen(true)}
                      >
                        Add a service
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="service-list service-list--dashboard">
                  {services.map((service) => (
                    <li className="service-list__item" key={service._id}>
                      <span className="service-list__name">
                        <span
                          className={`status-dot status-dot--${service.currentStatus}`}
                          aria-hidden="true"
                        />
                        <span className="service-list__title">
                          {service.name}
                        </span>
                      </span>
                      <ServiceStatusBadge status={service.currentStatus} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="public-link-card">
              <span className="public-link-card__icon" aria-hidden="true">
                <GlobeIcon size={18} />
              </span>
              <div className="public-link-card__text">
                <span>Public status page</span>
                <code>/status/{orgSlug}</code>
              </div>
              <Link
                className="icon-button"
                to={`/status/${orgSlug}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open public status page in a new tab"
                title="Open public status page"
              >
                <ExternalLinkIcon size={16} />
              </Link>
            </div>
          </aside>
        </div>

        {activeIncidents.length > 0 ? (
          <div className="dashboard-footnote">
            <AlertTriangleIcon size={16} />
            <span>
              {pluralize(activeIncidents.length, "incident")} still open.
              Status changes and public updates appear on the status page
              immediately.
            </span>
          </div>
        ) : null}
      </main>

      <CreateIncidentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        services={services}
        onCreated={handleCreatedIncident}
      />
      <AddServiceDialog
        open={serviceOpen}
        onClose={() => setServiceOpen(false)}
        onCreated={(service) => {
          setServiceOpen(false);
          setNotice(`Service “${service.name}” added.`);
          void reload({ silent: true });
        }}
      />
    </div>
  );
}
