export const SERVICE_STATUSES = ["operational", "degraded", "down"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];