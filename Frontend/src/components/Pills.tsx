import {
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  SERVICE_STATUS_LABELS,
} from "../constants";
import type {
  IncidentSeverity,
  IncidentStatus,
  ServiceStatus,
  UpdateVisibility,
} from "../types";

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span className={`pill pill--service-${status}`}>
      <span className="pill__dot" aria-hidden="true" />
      {SERVICE_STATUS_LABELS[status]}
    </span>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={`pill pill--incident-${status}`}>
      <span className="pill__dot" aria-hidden="true" />
      {INCIDENT_STATUS_LABELS[status]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return (
    <span className={`severity severity--${severity}`}>
      <span className="severity__dot" aria-hidden="true" />
      {INCIDENT_SEVERITY_LABELS[severity]}
    </span>
  );
}

export function VisibilityBadge({
  visibility,
}: {
  visibility: UpdateVisibility;
}) {
  return (
    <span
      className={`pill pill--visibility-${visibility}`}
    >
      {visibility === "public" ? "Public" : "Internal"}
    </span>
  );
}

export function LiveBadge({ live }: { live: boolean }) {
  return (
    <span className={`live-badge ${live ? "is-live" : ""}`.trim()}>
      <span className="live-badge__dot" aria-hidden="true" />
      {live ? "Live" : "Polling"}
    </span>
  );
}
