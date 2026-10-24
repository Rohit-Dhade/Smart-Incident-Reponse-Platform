import mongoose, { type Document } from "mongoose";
import type { Role } from "../types/role.ts";

export interface IMembership extends Document {
    userId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    role: Role;
}

const MembershipSchema = new mongoose.Schema<IMembership>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "viewer", "responder"],
        required: true
    }
}, { timestamps: true })

MembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true })

export const MemberShipModel = mongoose.model<IMembership>("MemberShip", MembershipSchema);