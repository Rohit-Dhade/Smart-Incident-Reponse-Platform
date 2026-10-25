import mongoose from "mongoose";
import { IncidentModel } from "../models/Incident.Model.ts";
import { IncidentUpdateModel } from "../models/IncidentUpdate.Model.ts";
import { UserModel } from "../models/User.Model.ts";
import { ApiError } from "./ApiError.ts";

export async function getIncidentUpdates(incidentId: string, organizationId: string) {
    if (!mongoose.isValidObjectId(incidentId)) {
        throw new ApiError(404, "Incident not found");
    }

    const incident = await IncidentModel.exists({ _id: incidentId, organizationId });
    if (!incident) {
        throw new ApiError(404, "Incident not found");
    }

    const updates = await IncidentUpdateModel.find({ incidentId, organizationId })
        .sort({ createdAt: 1 })
        .lean();

    const userIds = new Set<string>();
    for (const update of updates) {
        userIds.add(String(update.authorId));
        if (update.targetUserId) {
            userIds.add(String(update.targetUserId));
        }
    }

    const users = await UserModel.find({ _id: { $in: [...userIds] } })
        .select("name")
        .lean();

    const names = new Map(users.map((user) => [String(user._id), user.name]));

    return updates.map((update) => {
        const targetUser = update.targetUserId
            ? {
                  id: String(update.targetUserId),
                  name: names.get(String(update.targetUserId)) ?? "Former member",
              }
            : null;

        return {
            id: String(update._id),
            type: update.type,
            message: update.message,
            visibility: update.visibility,
            fromStatus: update.fromStatus ?? null,
            toStatus: update.toStatus ?? null,
            author: {
                id: String(update.authorId),
                name: names.get(String(update.authorId)) ?? "Former member",
            },
            targetUser,
            createdAt: update.createdAt,
            updatedAt: update.updatedAt,
        };
    });
}
