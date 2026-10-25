import type {
  IncidentSeverity,
  IncidentStatus,
  OverallStatus,
  Role,
  ServiceStatus,
  UpdateType,
} from "./types";

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded performance",
  down: "Major outage",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const INCIDENT_SEVERITY_RANK: Record<IncidentSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const OVERALL_STATUS_LABELS: Record<OverallStatus, string> = {
  operational: "All systems operational",
  partial_degradation: "Partial service degradation",
  major_outage: "Major service outage",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  responder: "Responder",
  viewer: "Viewer",
};

export const UPDATE_TYPE_LABELS: Record<UpdateType, string> = {
  created: "Incident opened",
  status_change: "Status changed",
  assigned: "Responder assigned",
  unassigned: "Responder unassigned",
  note: "Note",
};

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
];

const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  investigating: ["identified", "monitoring", "resolved"],
  identified: ["investigating", "monitoring", "resolved"],
  monitoring: ["investigating", "identified", "resolved"],
  resolved: ["investigating"],
};

export function allowedTransitions(status: IncidentStatus): IncidentStatus[] {
  return ALLOWED_TRANSITIONS[status];
}

export function canRespond(role: Role | undefined): boolean {
  return role === "admin" || role === "responder";
}
