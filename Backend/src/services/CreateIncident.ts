import mongoose, { type HydratedDocument } from "mongoose";
import { IncidentModel, type IIncident } from "../models/Incident.Model.ts";
import { IncidentUpdateModel } from "../models/IncidentUpdate.Model.ts";
import { ServiceModel } from "../models/Service.Model.ts";
import { ApiError } from "./ApiError.ts";
import type { IncidentSeverity } from "../types/incident.types.ts";

interface CreateIncidentInput {
    title: string;
    description?: string;
    severity: IncidentSeverity;
    serviceId: string;
    organizationId: string;
    userId: string;
}

export async function createIncident(
    input: CreateIncidentInput
): Promise<HydratedDocument<IIncident>> {
    const { title, description, severity, serviceId, organizationId, userId } = input;

    if (!mongoose.isValidObjectId(serviceId)) {
        throw new ApiError(404, "Service not found");
    }

    const session = await mongoose.startSession();
    let created: HydratedDocument<IIncident> | undefined;

    try {
        await session.withTransaction(async () => {

            const service = await ServiceModel.findOne({
                _id: serviceId,
                organizationId,
            }).session(session);

            if (!service) {
                throw new ApiError(404, "Service not found");
            }

            const [incident] = await IncidentModel.create(
                [
                    {
                        title,
                        ...(description !== undefined && { description }),
                        severity,
                        serviceId: service._id,
                        organizationId,
                        createdBy: userId,
                        assignedTo: [],
                    },
                ],
                { session }
            );

            if (!incident) {
                throw new ApiError(500, "Failed to create incident");
            }

            await IncidentUpdateModel.create(
                [
                    {
                        incidentId: incident._id,
                        organizationId,
                        authorId: userId,
                        type: "created",
                        message: `Incident opened: ${title}`,
                        toStatus: incident.status,
                    },
                ],
                { session }
            );


            await ServiceModel.updateOne(
                { _id: service._id, organizationId, currentStatus: "operational" },
                { $set: { currentStatus: "degraded" } },
                { session }
            );

            created = incident;
        });

        return created!;
    } finally {
        await session.endSession();
    }
}