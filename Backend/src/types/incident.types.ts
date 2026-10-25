export const INCIDENT_STATUSES = ["investigating", "identified", "monitoring", "resolved"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export const INCIDENT_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];
