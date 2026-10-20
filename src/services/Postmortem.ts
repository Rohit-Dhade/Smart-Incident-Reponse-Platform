import mongoose, { type HydratedDocument } from "mongoose";
import { IncidentModel } from "../models/Incident.Model.ts";
import { IncidentUpdateModel } from "../models/IncidentUpdate.Model.ts";
import { ServiceModel } from "../models/Service.Model.ts";
import { UserModel } from "../models/User.Model.ts";
import { PostmortemModel, type IPostmortem } from "../models/Postmortem.Model.ts";
import { generatePostmortemSections } from "./PostmortemAi.ts";
import { ApiError } from "./ApiError.ts";

interface Scope {
    incidentId: string;
    organizationId: string;
}

function assertValidId(id: string) {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(404, "Incident not found");
    }
}

async function loadPostmortem({ incidentId, organizationId }: Scope) {
    assertValidId(incidentId);
    const postmortem = await PostmortemModel.findOne({ incidentId, organizationId });
    if (!postmortem) {
        throw new ApiError(404, "Postmortem not found");
    }
    return postmortem;
}

export async function getPostmortem(scope: Scope) {
    return loadPostmortem(scope);
}

export async function generatePostmortemDraft(
    { incidentId, organizationId }: Scope,
    userId: string
): Promise<HydratedDocument<IPostmortem>> {
    assertValidId(incidentId);

    const incident = await IncidentModel.findOne({ _id: incidentId, organizationId }).lean();
    if (!incident) {
        throw new ApiError(404, "Incident not found");
    }
    if (incident.status !== "resolved" || !incident.resolvedAt) {
        throw new ApiError(409, "Postmortems can only be drafted for resolved incidents");
    }

    const existing = await PostmortemModel.findOne({ incidentId: incident._id, organizationId })
        .select("status")
        .lean();
    if (existing?.status === "published") {
        throw new ApiError(409, "This postmortem is already published");
    }

    const [service, updates] = await Promise.all([
        ServiceModel.findOne({ _id: incident.serviceId, organizationId }).select("name").lean(),
        IncidentUpdateModel.find({ incidentId: incident._id, organizationId })
            .sort({ createdAt: 1 })
            .limit(200)
            .lean(),
    ]);

    const authorIds = [...new Set(updates.map((u) => String(u.authorId)))];
    const authors = await UserModel.find({ _id: { $in: authorIds } }).select("name").lean();
    const names = new Map(authors.map((a) => [String(a._id), a.name]));

    const minutes = Math.round(
        (incident.resolvedAt.getTime() - incident.createdAt.getTime()) / 60000
    );

    const timeline = updates
        .map((u) => {
            const who = names.get(String(u.authorId)) ?? "Unknown";
            const change = u.fromStatus && u.toStatus ? ` (${u.fromStatus} -> ${u.toStatus})` : "";
            return `[${u.createdAt.toISOString()}] ${u.type}${change} by ${who}: ${u.message}`;
        })
        .join("\n");

    const incidentData = [
        `Title: ${incident.title}`,
        `Service: ${service?.name ?? "Unknown"}`,
        `Severity: ${incident.severity}`,
        `Opened: ${incident.createdAt.toISOString()}`,
        `Resolved: ${incident.resolvedAt.toISOString()}`,
        `Duration: ${minutes} minutes`,
        `Description: ${incident.description || "None"}`,
        `Timeline:\n${timeline}`,
    ].join("\n");

    const { sections, model } = await generatePostmortemSections(incidentData);

    try {

        const draft = await PostmortemModel.findOneAndUpdate(
            { incidentId: incident._id, organizationId, status: "draft" },
            {
                $set: { ...sections, aiGenerated: true, aiModel: model, generatedBy: userId },
                $unset: { approvedBy: "", approvedAt: "" },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );
        return draft;
    } catch (error: any) {
        if (error.code === 11000) {
            throw new ApiError(409, "This postmortem is already published");
        }
        throw error;
    }
}

interface EditableFields {
    summary?: string;
    impact?: string;
    rootCause?: string;
    resolution?: string;
    actionItems?: string[];
}

export async function updatePostmortem(scope: Scope, fields: EditableFields) {
    if (Object.keys(fields).length === 0) {
        throw new ApiError(400, "Nothing to update");
    }

    const postmortem = await loadPostmortem(scope);
    if (postmortem.status === "published") {
        throw new ApiError(409, "A published postmortem cannot be edited");
    }

    const updated = await PostmortemModel.findOneAndUpdate(
        { _id: postmortem._id, organizationId: scope.organizationId, status: "draft" },
        { $set: fields },
        { new: true, runValidators: true }
    );
    if (!updated) {
        throw new ApiError(409, "This postmortem was just published");
    }
    return updated;
}

export async function publishPostmortem(scope: Scope, userId: string) {
    const postmortem = await loadPostmortem(scope);

    if (postmortem.status === "published") {
        throw new ApiError(409, "This postmortem is already published");
    }
    if (!postmortem.summary.trim()) {
        throw new ApiError(400, "A postmortem needs a summary before it can be published");
    }

    const published = await PostmortemModel.findOneAndUpdate(
        { _id: postmortem._id, organizationId: scope.organizationId, status: "draft" },
        { $set: { status: "published", approvedBy: userId, approvedAt: new Date() } },
        { new: true }
    );
    if (!published) {
        throw new ApiError(409, "This postmortem is already published");
    }
    return published;
}