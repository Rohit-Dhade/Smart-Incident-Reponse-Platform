export type Role = "admin" | "responder" | "viewer";

export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export type ServiceStatus = "operational" | "degraded" | "down";

export type UpdateType =
  | "created"
  | "status_change"
  | "assigned"
  | "unassigned"
  | "note";

export type UpdateVisibility = "internal" | "public";

export type PostmortemStatus = "draft" | "published";

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: Role;
}

export interface Incident {
  _id: string;
  title: string;
  description?: string;
  organizationId: string;
  serviceId: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  assignedTo: string[];
  resolvedAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  name: string;
  organizationId: string;
  currentStatus: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface PendingInvitation {
  _id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
}

export interface CreatedInvitation {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  inviteLink: string;
}

export interface AssignmentMember {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface IncidentAssignees {
  canAssign: boolean;
  assigned: AssignmentMember[];
  available: AssignmentMember[];
}

export interface IncidentUpdate {
  id: string;
  type: UpdateType;
  message: string;
  visibility: UpdateVisibility;
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus | null;
  author: {
    id: string;
    name: string;
  };
  targetUser: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Postmortem {
  _id: string;
  incidentId: string;
  organizationId: string;
  summary: string;
  impact: string;
  rootCause: string;
  resolution: string;
  actionItems: string[];
  status: PostmortemStatus;
  aiGenerated: boolean;
  aiModel?: string;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OverallStatus =
  | "operational"
  | "partial_degradation"
  | "major_outage";

export interface PublicStatusUpdate {
  message: string;
  at: string;
}

export interface PublicStatusIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  service: string | null;
  startedAt: string;
  resolvedAt: string | null;
  updates: PublicStatusUpdate[];
}

export interface PublicStatus {
  organization: {
    name: string;
    slug: string;
  };
  overall: OverallStatus;
  services: Array<{
    name: string;
    status: ServiceStatus;
  }>;
  incidents: PublicStatusIncident[];
}
