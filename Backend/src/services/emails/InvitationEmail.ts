import { escapeHtml, oneLine } from "./escape.ts";

interface InvitationEmailInput {
  organizationName: string;
  inviterName: string;
  role: string;
  link: string;
  expiresAt: Date;
}

export function invitationEmail(input: InvitationEmailInput) {
  const { organizationName, inviterName, role, link, expiresAt } = input;
  const until = expiresAt.toISOString().slice(0, 10);

  const subject = oneLine(`${inviterName} invited you to join ${organizationName}`);

  const text = [
    `${inviterName} invited you to join ${organizationName} as a ${role}.`,
    ``,
    `Accept the invitation: ${link}`,
    ``,
    `This link works until ${until} (UTC). If you weren't expecting this, you can ignore this email.`,
  ].join("\n");

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
  <h2 style="margin-bottom: 8px;">You're invited</h2>
  <p><strong>${escapeHtml(inviterName)}</strong> invited you to join
     <strong>${escapeHtml(organizationName)}</strong> as a <strong>${escapeHtml(role)}</strong>.</p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(link)}"
       style="background: #2563eb; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
      Accept invitation
    </a>
  </p>
  <p style="font-size: 13px; color: #6b7280;">
    This link works until ${until} (UTC). If you weren't expecting this, you can ignore this email.
  </p>
</div>`;

  return { subject, text, html };
}