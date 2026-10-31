import type { CreatedInvitation, ResendInvitationResult, Role } from "./types";

/**
 * The backend returns snake_case fields when an invitation is created and
 * camelCase fields when one is resent. Normalize both into the client shape.
 */
interface InvitationEmailFields {
  emailSent?: boolean;
  email_sent?: boolean;
  inviteLink?: string;
  invite_link?: string;
}

export interface CreatedInvitationResponse extends InvitationEmailFields {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
}

export interface ResendInvitationResponse extends InvitationEmailFields {
  id: string;
  email: string;
  expiresAt: string;
}

function emailFields(response: InvitationEmailFields) {
  return {
    emailSent: response.emailSent ?? response.email_sent ?? false,
    inviteLink: response.inviteLink ?? response.invite_link ?? "",
  };
}

export function normalizeCreatedInvitation(
  response: CreatedInvitationResponse,
): CreatedInvitation {
  return {
    id: response.id,
    email: response.email,
    role: response.role,
    expiresAt: response.expiresAt,
    ...emailFields(response),
  };
}

export function normalizeResendInvitation(
  response: ResendInvitationResponse,
): ResendInvitationResult {
  return {
    id: response.id,
    email: response.email,
    expiresAt: response.expiresAt,
    ...emailFields(response),
  };
}
