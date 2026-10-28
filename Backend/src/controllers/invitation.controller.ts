import type { Request, Response } from "express";
import {
    createInvitation,
    listInvitations,
    revokeInvitation,
    acceptInvitation,
} from "../services/Invitations.ts";
import { listMembers } from "../services/Members.ts";
import { setAuthCookie } from "../utils/authCookie.ts";

export async function inviteHandler(req: Request, res: Response) {
    const { invitation, token } = await createInvitation({
        email: req.body.email,
        role: req.body.role,
        organizationId: req.user!.organizationId,
        invitedBy: req.user!.id,
    });

    const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

    return res.status(201).json({
        success: true,
        data: {
            id: invitation._id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            inviteLink,
        },
    });
}

export async function listInvitationsHandler(req: Request, res: Response) {
    const data = await listInvitations(req.user!.organizationId);
    return res.status(200).json({ success: true, data });
}

export async function revokeInvitationHandler(req: Request, res: Response) {
    await revokeInvitation(req.params.id as string, req.user!.organizationId);
    return res.status(200).json({ success: true, message: "Invitation revoked" });
}

export async function acceptInvitationHandler(req: Request, res: Response) {
    const joined = await acceptInvitation({
        token: req.body.token,
        name: req.body.name,
        password: req.body.password,
    });

    setAuthCookie(res, {
        id: joined.userId,
        organizationId: joined.organizationId,
        role: joined.role,
    });

    return res.status(200).json({
        success: true,
        message: "Welcome aboard",
        data: { name: joined.name, email: joined.email, role: joined.role },
    });
}

export async function listMembersHandler(req: Request, res: Response) {
    const data = await listMembers(req.user!.organizationId);
    return res.status(200).json({ success: true, data });
}