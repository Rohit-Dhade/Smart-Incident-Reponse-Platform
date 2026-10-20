import mongoose, { type Document } from "mongoose";
import { POSTMORTEM_STATUSES, type PostmortemStatus } from "../types/postmortem.types.ts";

export interface IPostmortem extends Document {
    incidentId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    summary: string;
    impact: string;
    rootCause: string;
    resolution: string;
    actionItems: string[];
    status: PostmortemStatus;
    aiGenerated: boolean;
    aiModel?: string;
    generatedBy: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}

const PostmortemSchema = new mongoose.Schema<IPostmortem>(
    {
        incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", required: true },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
        summary: { type: String, default: "", trim: true },
        impact: { type: String, default: "", trim: true },
        rootCause: { type: String, default: "", trim: true },
        resolution: { type: String, default: "", trim: true },
        actionItems: { type: [String], default: [] },
        status: { type: String, enum: POSTMORTEM_STATUSES, default: "draft" },
        aiGenerated: { type: Boolean, default: false },
        aiModel: { type: String },
        generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        approvedAt: { type: Date },
    },
    { timestamps: true }
);

PostmortemSchema.index({ incidentId: 1 }, { unique: true });
PostmortemSchema.index({ organizationId: 1, createdAt: -1 });

export const PostmortemModel = mongoose.model<IPostmortem>("Postmortem", PostmortemSchema);