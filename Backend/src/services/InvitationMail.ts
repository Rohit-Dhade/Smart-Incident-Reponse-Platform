import type { HydratedDocument } from "mongoose";
import { OrganizationModel } from "../models/Organization.Model.js";
import { UserModel } from "../models/User.Model.js";
import type { IInvitation } from "../models/Invitation.Model.js";
import { invitationEmail } from "../services/emails/InvitationEmail.js";
import { sendMail } from "../services/mailer.js";

export async function emailInvitation(
    invitation: HydratedDocument<IInvitation>,
    token: string,
    inviterId: string
) {
    const [organization, inviter] = await Promise.all([
        OrganizationModel.findById(invitation.organizationId).select("name").lean(),
        UserModel.findById(inviterId).select("name").lean(),
    ]);

    const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

    const { subject, text, html } = invitationEmail({
        organizationName: organization?.name ?? "your team",
        inviterName: inviter?.name ?? "A teammate",
        role: invitation.role,
        link: inviteLink,
        expiresAt: invitation.expiresAt,
    });

    const emailSent = await sendMail({ to: invitation.email, subject, text, html });
    return { emailSent, inviteLink };
}   