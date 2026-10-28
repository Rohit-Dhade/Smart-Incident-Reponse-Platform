import crypto from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { InvitationModel } from "../models/Invitation.Model.ts";
import { UserModel } from "../models/User.Model.ts";
import { MemberShipModel } from "../models/Membership.Model.ts";
import { CreateUser } from "../services/CreateUser.ts";
import { CreateMemberShip } from "../services/CreateMember.ts";
import { ApiError } from "../services/ApiError.ts";
import type { Role } from "../types/role.ts";

const INVITE_DAYS = 7;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function createInvitation(input: {
    email: string;
    role: Role;
    organizationId: string;
    invitedBy: string;
}) {
    const { email, role, organizationId, invitedBy } = input;

    const existingUser = await UserModel.findOne({ email }).select("_id").lean();
    if (existingUser) {
        const isMember = await MemberShipModel.exists({ userId: existingUser._id, organizationId });
        if (isMember) {
            throw new ApiError(409, "This person is already a member of your organization");
        }
    }

    await InvitationModel.updateMany(
        { organizationId, email, status: "pending", expiresAt: { $lte: new Date() } },
        { $set: { status: "expired" } }
    );

    const token = crypto.randomBytes(32).toString("hex");

    try {
        const invitation = await InvitationModel.create({
            organizationId,
            email,
            role,
            tokenHash: hashToken(token),
            invitedBy,
            expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
        });
        return { invitation, token };
    } catch (error: any) {
        if (error.code === 11000) {
            throw new ApiError(409, "This email already has a pending invitation");
        }
        throw error;
    }
}

export async function listInvitations(organizationId: string) {
    return InvitationModel.find({
        organizationId,
        status: "pending",
        expiresAt: { $gt: new Date() },
    })
        .select("email role expiresAt createdAt")
        .sort({ createdAt: -1 })
        .lean();
}

export async function revokeInvitation(invitationId: string, organizationId: string) {
    if (!mongoose.isValidObjectId(invitationId)) {
        throw new ApiError(404, "Invitation not found");
    }
    const revoked = await InvitationModel.findOneAndUpdate(
        { _id: invitationId, organizationId, status: "pending" },
        { $set: { status: "revoked" } },
        { new: true }
    );
    if (!revoked) {
        throw new ApiError(404, "Invitation not found");
    }
    return revoked;
}

export async function acceptInvitation(input: { token: string; name?: string; password: string }) {
    const { token, name, password } = input;
    const session = await mongoose.startSession();
    let result: { userId: string; name: string; email: string; organizationId: string; role: Role } | undefined;

    try {
        await session.withTransaction(async () => {
            const invitation = await InvitationModel.findOneAndUpdate(
                { tokenHash: hashToken(token), status: "pending", expiresAt: { $gt: new Date() } },
                { $set: { status: "accepted", acceptedAt: new Date() } },
                { new: true, session }
            );
            if (!invitation) {
                throw new ApiError(400, "This invitation is invalid or has expired");
            }

            const existing = await UserModel.findOne({ email: invitation.email })
                .select("+passwordhash")
                .session(session);

            let user: { _id: mongoose.Types.ObjectId; name: string; email: string };

            if (existing) {
                const ok = await bcrypt.compare(password, existing.passwordhash);
                if (!ok) {
                    throw new ApiError(401, "Incorrect password for this account");
                }
                user = existing;
            } else {
                if (!name) {
                    throw new ApiError(400, "Name is required to create your account");
                }
                if (password.length < 6) {
                    throw new ApiError(400, "Password must be at least 6 characters");
                }
                user = await CreateUser(name, invitation.email, password, session);
            }

            await CreateMemberShip(user._id, invitation.organizationId, invitation.role, session);

            result = {
                userId: String(user._id),
                name: user.name,
                email: user.email,
                organizationId: String(invitation.organizationId),
                role: invitation.role,
            };
        });

        return result!;
    } catch (error: any) {
        if (error.code === 11000) {
            throw new ApiError(
                409,
                error.keyPattern?.email
                    ? "An account with this email already exists"
                    : "You are already a member of this organization"
            );
        }
        throw error;
    } finally {
        await session.endSession();
    }
}