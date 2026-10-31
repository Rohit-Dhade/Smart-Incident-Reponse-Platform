import { escapeHtml } from "./escape.ts";

export function resetPasswordEmail(input: { name: string; link: string; minutes: number }) {
    const { name, link, minutes } = input;
    const subject = "Reset your password";

    const text = [
        `Hi ${name},`,
        ``,
        `We received a request to reset your password. This link works for ${minutes} minutes:`,
        link,
        ``,
        `If you didn't ask for this, you can ignore this email. Your password will stay the same.`,
    ].join("\n");

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
  <h2 style="margin-bottom: 8px;">Reset your password</h2>
  <p>Hi ${escapeHtml(name)}, we received a request to reset your password.</p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(link)}"
       style="background: #2563eb; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
      Choose a new password
    </a>
  </p>
  <p style="font-size: 13px; color: #6b7280;">
    This link works for ${minutes} minutes. If you didn't ask for this, you can ignore this email
    and your password will stay the same.
  </p>
</div>`;

    return { subject, text, html };
}

export function passwordChangedEmail(input: { name: string }) {
    const { name } = input;
    const subject = "Your password was changed";
    const text = [
        `Hi ${name},`,
        ``,
        `The password on your account was just changed.`,
        `If this was you, there is nothing more to do. If it wasn't, reset your password again right away and tell your administrator.`,
    ].join("\n");

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
  <h2 style="margin-bottom: 8px;">Your password was changed</h2>
  <p>Hi ${escapeHtml(name)}, the password on your account was just changed.</p>
  <p style="font-size: 13px; color: #6b7280;">
    If this was you, there is nothing more to do. If it wasn't, reset your password again right away
    and tell your administrator.
  </p>
</div>`;

    return { subject, text, html };
}