import type { HydratedDocument } from "mongoose";
import { ApiError } from "./ApiError.ts";
import { IncidentModel, type IIncident } from "../models/Incident.Model.ts";
import mongoose from "mongoose";

export async function getIncidents(
    organizationId: string
): Promise<HydratedDocument<IIncident>[]> {
    try {
        return await IncidentModel.find({ organizationId }).sort({ createdAt: -1 });
    } catch (error: any) {
        throw error;
    }
}

export async function getIncidentById(incidentId: string, organizationId: string) {
    if (!mongoose.isValidObjectId(incidentId)) {
        throw new ApiError(404, "Incident not found");
    }
    const incident = await IncidentModel.findOne({ _id: incidentId, organizationId });
    if (!incident) {
        throw new ApiError(404, "Incident not found");
    }
    return incident;
}