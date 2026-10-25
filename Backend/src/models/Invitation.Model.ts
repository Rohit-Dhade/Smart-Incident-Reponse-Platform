import mongoose, { type Document } from "mongoose";
import { ROLES, type Role } from "../types/role.ts";

export const INVITATION_STATUSES = ["pending", "accepted", "revoked", "expired"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export interface IInvitation extends Document {
    organizationId: mongoose.Types.ObjectId;
    email: string;
    role: Role;
    tokenHash: string;
    status: InvitationStatus;
    invitedBy: mongoose.Types.ObjectId;
    expiresAt: Date;
    acceptedAt?: Date;
}

const InvitationSchema = new mongoose.Schema<IInvitation>(
    {
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        role: { type: String, enum: ROLES, required: true },
        tokenHash: { type: String, required: true },
        status: { type: String, enum: INVITATION_STATUSES, default: "pending" },
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        expiresAt: { type: Date, required: true },
        acceptedAt: { type: Date },
    },
    { timestamps: true }
);

InvitationSchema.index({ tokenHash: 1 }, { unique: true });

InvitationSchema.index(
    { organizationId: 1, email: 1 },
    { unique: true, partialFilterExpression: { status: "pending" } }
);

export const InvitationModel = mongoose.model<IInvitation>("Invitation", InvitationSchema);