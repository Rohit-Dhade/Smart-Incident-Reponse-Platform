export const ROLES = ["admin", "responder", "viewer"] as const;
export type Role = (typeof ROLES)[number];  