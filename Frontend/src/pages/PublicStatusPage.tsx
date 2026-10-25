import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { EmptyState } from "../components/Feedback";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  GlobeIcon,
  PlusIcon,
  XCircleIcon,
} from "../components/Icons";
import {
  IncidentStatusBadge,
  LiveBadge,
  ServiceStatusBadge,
  SeverityBadge,
} from "../components/Pills";
import {
  INCIDENT_SEVERITY_RANK,
  OVERALL_STATUS_LABELS,
} from "../constants";
import {
  formatDateTime,
  formatDuration,
  formatTime,
  getInitials,
  pluralize,
  relativeTime,
} from "../format";
import { usePublicStatus } from "../hooks/usePublicStatus";
import { usePageTitle } from "../hooks/usePageTitle";
import type {
  OverallStatus,
  PublicStatus,
  PublicStatusIncident,
} from "../types";

const OVERALL_DESCRIPTIONS: Record<OverallStatus, string> = {
  operational:
    "Every monitored service is operating normally. No action is needed.",
  partial_degradation:
    "Some services are degraded. The team is actively working on a fix.",
  major_outage:
    "One or more services are down. Updates are posted here as the response progresses.",
};

const OVERALL_ICONS: Record<OverallStatus, typeof CheckCircleIcon> = {
  operational: CheckCircleIcon,
  partial_degradation: AlertTriangleIcon,
  major_outage: XCircleIcon,
};

function PublicHeader({ data }: { data: PublicStatus | null }) {
  return (
    <header className="public-header">
      <div className="container public-header__inner">
        <div className="public-header__brand">
          <Brand />
          <span className="public-header__divider" aria-hidden="true" />
          {data ? (
            <span className="public-org">
              <span className="public-org__avatar" aria-hidden="true">
                {getInitials(data.organization.name)}
              </span>
              <span className="public-org__text">
                <strong>{data.organization.name}</strong>
                <span>Status page</span>
              </span>
            </span>
          ) : (
            <span className="public-org__text">
              <strong>Status page</strong>
            </span>
          )}
        </div>
        <nav aria-label="Account">
          <Link className="nav-link" to="/login">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

function StatusMap({ data }: { data: PublicStatus }) {
  const visibleServices = data.services.slice(0, 4);
  const remaining = data.services.length - visibleServices.length;

  return (
    <div className="status-map" aria-hidden="true">
      <div className="status-map__ring status-map__ring--outer" />
      <div className="status-map__ring status-map__ring--inner" />

      <div className="status-map__core">
        <span className="status-map__core-mark">
          {getInitials(data.organization.name)}
        </span>
        <span className="status-map__core-label">Status</span>
      </div>

      {visibleServices.map((service, index) => (
        <span
          className={`status-map__tile status-map__tile--${index + 1}`}
          key={service.name}
        >
          <span
            className={`status-dot status-dot--${service.status}`}
            aria-hidden="true"
          />
          <span className="status-map__tile-name">{service.name}</span>
        </span>
      ))}

      {remaining > 0 ? (
        <span className="status-map__more">+{remaining} more</span>
      ) : null}

      {visibleServices.length === 0 ? (
        <span className="status-map__empty">No services yet</span>
      ) : null}
    </div>
  );
}

function IncidentCard({ incident }: { incident: PublicStatusIncident }) {
  return (
    <details className="incident-card" id={`incident-${incident.id}`}>
      <summary className="incident-card__summary">
        <span className="incident-card__main">
          <span className="incident-card__top">
            <SeverityBadge severity={incident.severity} />
            <IncidentStatusBadge status={incident.status} />
          </span>
          <span className="incident-card__title">{incident.title}</span>
          <span className="incident-card__meta">
            {incident.service ?? "General"} &middot; Started{" "}
            <time
              dateTime={incident.startedAt}
              title={formatDateTime(incident.startedAt)}
            >
              {relativeTime(incident.startedAt)}
            </time>
            {incident.resolvedAt ? (
              <>
                {" "}
                &middot; Resolved{" "}
                <time
                  dateTime={incident.resolvedAt}
                  title={formatDateTime(incident.resolvedAt)}
                >
                  {relativeTime(incident.resolvedAt)}
                </time>
              </>
            ) : null}
          </span>
        </span>
        <span className="incident-card__toggle">
          <PlusIcon size={18} />
          <span className="sr-only">Show incident updates</span>
        </span>
      </summary>

      <div className="incident-card__body">
        <div className="incident-card__timeline-label">
          <span>Public updates</span>
          <span>{pluralize(incident.updates.length, "update")}</span>
        </div>
        <ol className="public-timeline">
          {incident.updates.map((update, index) => (
            <li
              className="public-timeline__item"
              key={`${update.at}-${index}`}
            >
              <span className="public-timeline__marker" aria-hidden="true" />
              <div className="public-timeline__content">
                <time
                  className="public-timeline__time"
                  dateTime={update.at}
                  title={formatDateTime(update.at)}
                >
                  {formatDateTime(update.at)}
                </time>
                <p>{update.message}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="incident-card__footer">
          <span>
            Opened {formatDateTime(incident.startedAt)}
          </span>
          {incident.resolvedAt ? (
            <span>
              Resolved {formatDateTime(incident.resolvedAt)} &middot;{" "}
              {formatDuration(incident.startedAt, incident.resolvedAt)} total
            </span>
          ) : (
            <span>Ongoing for {formatDuration(incident.startedAt)}</span>
          )}
        </div>
      </div>
    </details>
  );
}

function ActiveIncidents({
  incidents,
  hasServices,
}: {
  incidents: PublicStatusIncident[];
  hasServices: boolean;
}) {
  if (incidents.length === 0) {
    return (
      <div className="status-empty panel">
        <span className="status-empty__icon" aria-hidden="true">
          <CheckCircleIcon size={24} />
        </span>
        <div>
          <h3>No active incidents</h3>
          <p>
            {hasServices
              ? "All monitored services are running normally. This page updates automatically."
              : "This status page does not have any monitored services yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="incident-stack">
      {incidents.map((incident) => (
        <IncidentCard incident={incident} key={incident.id} />
      ))}
    </div>
  );
}

function StatusPage({
  data,
  live,
  lastUpdated,
}: {
  data: PublicStatus;
  live: boolean;
  lastUpdated: Date | null;
}) {
  const activeIncidents = data.incidents
    .filter((incident) => incident.status !== "resolved")
    .sort(
      (left, right) =>
        INCIDENT_SEVERITY_RANK[left.severity] -
          INCIDENT_SEVERITY_RANK[right.severity] ||
        new Date(right.startedAt).getTime() -
          new Date(left.startedAt).getTime(),
    );
  const pastIncidents = data.incidents
    .filter((incident) => incident.status === "resolved")
    .sort(
      (left, right) =>
        new Date(right.resolvedAt ?? right.startedAt).getTime() -
        new Date(left.resolvedAt ?? left.startedAt).getTime(),
    );
  const updateCount = data.incidents.reduce(
    (total, incident) => total + incident.updates.length,
    0,
  );
  const OverallIcon = OVERALL_ICONS[data.overall];
  const overallDescription = OVERALL_DESCRIPTIONS[data.overall];

  return (
    <>
      <section className={`status-hero status-hero--${data.overall}`}>
        <div className="container status-hero__inner">
          <div className="status-hero__copy">
            <div className="status-hero__eyebrow">
              <span className="status-hero__eyebrow-label">Current status</span>
              <LiveBadge live={live} />
            </div>
            <h1 className="status-hero__title" aria-live="polite">
              {OVERALL_STATUS_LABELS[data.overall]}
            </h1>
            <p className="status-hero__lede">{overallDescription}</p>
            <div className="status-hero__meta">
              <span className="status-hero__icon" aria-hidden="true">
                <OverallIcon size={20} />
              </span>
              <span>
                Last checked{" "}
                <time dateTime={lastUpdated?.toISOString()}>
                  {lastUpdated ? formatTime(lastUpdated) : "—"}
                </time>
              </span>
              <span className="status-hero__meta-divider" aria-hidden="true" />
              <a href="#incidents">
                View incidents
                <ArrowRightIcon size={15} />
              </a>
            </div>
          </div>

          <StatusMap data={data} />
        </div>
      </section>

      <div className="status-facts">
        <div className="container status-facts__inner">
          <div className="status-fact">
            <span className="status-fact__label">Services monitored</span>
            <span className="status-fact__value">{data.services.length}</span>
          </div>
          <div className="status-fact">
            <span className="status-fact__label">Active incidents</span>
            <span className="status-fact__value">{activeIncidents.length}</span>
          </div>
          <div className="status-fact">
            <span className="status-fact__label">Public updates</span>
            <span className="status-fact__value">{updateCount}</span>
          </div>
          <div className="status-fact">
            <span className="status-fact__label">Page status</span>
            <span className="status-fact__value status-fact__value--status">
              <span
                className={`status-dot status-dot--${data.overall}`}
                aria-hidden="true"
              />
              {live ? "Live" : "Polling"}
            </span>
          </div>
        </div>
      </div>

      <div className="container status-layout">
        <section
          className="panel status-services"
          aria-labelledby="services-heading"
        >
          <div className="panel__header">
            <div>
              <p className="eyebrow">Components</p>
              <h2 id="services-heading">Services</h2>
            </div>
            <span className="panel__meta">
              {pluralize(data.services.length, "service")}
            </span>
          </div>

          {data.services.length > 0 ? (
            <ul className="service-list">
              {data.services.map((service) => (
                <li className="service-list__item" key={service.name}>
                  <span className="service-list__name">
                    <span
                      className={`status-dot status-dot--${service.status}`}
                      aria-hidden="true"
                    />
                    {service.name}
                  </span>
                  <span className="service-list__status">
                    <ServiceStatusBadge status={service.status} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="panel__body">
              <EmptyState
                icon={<ActivityIcon size={22} />}
                title="No services yet"
                description="The team has not added any monitored services to this status page."
              />
            </div>
          )}
        </section>

        <section
          className="status-incidents"
          id="incidents"
          aria-labelledby="incidents-heading"
        >
          <div className="status-incidents__header">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2 id="incidents-heading">Incidents</h2>
            </div>
            {activeIncidents.length > 0 ? (
              <span className="panel__meta">
                {pluralize(activeIncidents.length, "active incident")}
              </span>
            ) : null}
          </div>

          <ActiveIncidents
            incidents={activeIncidents}
            hasServices={data.services.length > 0}
          />

          {pastIncidents.length > 0 ? (
            <div className="status-history">
              <div className="status-history__header">
                <h3>Past incidents</h3>
                <span>Resolved in the last 7 days</span>
              </div>
              <div className="incident-stack">
                {pastIncidents.map((incident) => (
                  <IncidentCard incident={incident} key={incident.id} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="status-cta">
        <div className="container status-cta__inner">
          <div>
            <p className="eyebrow eyebrow--on-dark">StatusDesk</p>
            <h2>Run a status page your team can keep up with.</h2>
            <p>
              Incident updates, customer communication, and postmortems in one
              workspace.
            </p>
          </div>
          <Link className="btn btn--on-dark" to="/register">
            Create a workspace
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </section>

      <footer className="public-footer">
        <div className="container public-footer__inner">
          <span>
            Powered by <Brand />
          </span>
          <span>
            {data.organization.name} &middot;{" "}
            <Link to="/login">Workspace sign in</Link>
          </span>
        </div>
      </footer>
    </>
  );
}

export function PublicStatusPage() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const { data, loading, error, notFound, live, lastUpdated, retry } =
    usePublicStatus(slug);

  usePageTitle(
    data
      ? `${data.organization.name} status`
      : notFound
        ? "Status page not found"
        : "Status page",
  );

  useEffect(() => {
    if (!data || !location.hash) return;
    const target = document.getElementById(
      decodeURIComponent(location.hash.slice(1)),
    );
    if (target) target.scrollIntoView();
  }, [data, location.hash]);

  if (loading && !data) {
    return (
      <div className="public-page">
        <PublicHeader data={null} />
        <main id="main" tabIndex={-1} className="container page-state">
          <div className="page-state__loading" role="status" aria-live="polite">
            <span className="page-loader__spinner" aria-hidden="true" />
            <span>Loading status page&hellip;</span>
          </div>
        </main>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="public-page">
        <PublicHeader data={null} />
        <main id="main" tabIndex={-1} className="container page-state">
          <EmptyState
            icon={<GlobeIcon size={24} />}
            title="Status page not found"
            description={`We could not find a status page at /status/${slug}. Check the link or look up the organization slug again.`}
            headingLevel="h1"
            action={
              <Link className="btn btn--primary" to="/">
                Find a status page
                <ArrowRightIcon size={16} />
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="public-page">
        <PublicHeader data={null} />
        <main id="main" tabIndex={-1} className="container page-state">
          <EmptyState
            icon={<AlertTriangleIcon size={24} />}
            title="This page is unavailable"
            description={
              error ||
              "We could not load this status page. Please try again in a moment."
            }
            headingLevel="h1"
            action={
              <button type="button" className="btn btn--primary" onClick={retry}>
                Try again
              </button>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="public-page">
      <PublicHeader data={data} />
      <main id="main" tabIndex={-1}>
        <StatusPage data={data} live={live} lastUpdated={lastUpdated} />
      </main>
    </div>
  );
}
