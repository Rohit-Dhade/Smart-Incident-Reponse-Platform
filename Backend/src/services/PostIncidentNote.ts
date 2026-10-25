import mongoose, { type HydratedDocument } from "mongoose";
import { IncidentModel } from "../models/Incident.Model.ts";
import { IncidentUpdateModel, type IIncidentUpdate } from "../models/IncidentUpdate.Model.ts";
import { ApiError } from "./ApiError.ts";
import type { UpdateVisibility } from "../types/update.types.ts";

interface PostNoteInput {
    incidentId: string;
    message: string;
    visibility?: UpdateVisibility;
    organizationId: string;
    authorId: string;
}

export async function postIncidentNote(
    input: PostNoteInput
): Promise<HydratedDocument<IIncidentUpdate>> {
    const { incidentId, message, visibility, organizationId, authorId } = input;

    if (!mongoose.isValidObjectId(incidentId)) {
        throw new ApiError(404, "Incident not found");
    }

    const exists = await IncidentModel.exists({ _id: incidentId, organizationId });
    if (!exists) {
        throw new ApiError(404, "Incident not found");
    }

    return IncidentUpdateModel.create({
        incidentId,
        organizationId,
        authorId,
        type: "note",
        message,
        visibility: visibility ?? "internal",
    });
}