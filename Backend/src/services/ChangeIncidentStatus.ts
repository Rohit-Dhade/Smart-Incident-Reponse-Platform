import mongoose, { type HydratedDocument } from "mongoose";
import { IncidentModel, type IIncident } from "../models/Incident.Model.ts";
import { ServiceModel } from "../models/Service.Model.ts";
import { IncidentUpdateModel } from "../models/IncidentUpdate.Model.ts";
import { ApiError } from "./ApiError.ts";
import { canTransition } from "./IncidentStateMachines.ts";
import type { IncidentStatus } from "../types/incident.types.ts";

interface ChangeIncidentStatusInput {
    incidentId: string;
    newStatus: IncidentStatus;
    organizationId: string;
    userId: string;
    note?: string;
}

export async function changeIncidentStatus({
    incidentId,
    newStatus,
    organizationId,
    userId,
    note
}: ChangeIncidentStatusInput): Promise<HydratedDocument<IIncident>> {
    if (!mongoose.isValidObjectId(incidentId)) {
        throw new ApiError(404, "Incident not found");
    }

    const session = await mongoose.startSession();
    let updated: HydratedDocument<IIncident> | undefined;

    try {
        await session.withTransaction(async () => {
            const incident = await IncidentModel.findOne({
                _id: incidentId,
                organizationId
            }).session(session);

            if (!incident) {
                throw new ApiError(404, "Incident not found");
            }

            const from = incident.status;

            if (!canTransition(from, newStatus)) {
                throw new ApiError(
                    409,
                    `Cannot move incident from ${from} to ${newStatus}`
                );
            }

            const update =
                newStatus === "resolved"
                    ? { $set: { status: newStatus, resolvedAt: new Date() } }
                    : from === "resolved"
                        ? { $set: { status: newStatus }, $unset: { resolvedAt: "" } }
                        : { $set: { status: newStatus } };


            const result = await IncidentModel.findOneAndUpdate(
                { _id: incident._id, organizationId, status: from },
                update,
                { new: true, session }
            );

            if (!result) {
                throw new ApiError(
                    409,
                    "Incident was changed by someone else, please refresh"
                );
            }

            updated = result;

            await IncidentUpdateModel.create(
                [
                    {
                        incidentId: incident._id,
                        organizationId,
                        authorId: userId,
                        type: "status_change",
                        fromStatus: from,
                        toStatus: newStatus,
                        message: note?.trim() || `Status changed from ${from} to ${newStatus}`,
                    },
                ],
                { session }
            );

            if (newStatus === "resolved") {

                const stillOpen = await IncidentModel.exists({
                    serviceId: incident.serviceId,
                    organizationId,
                    status: { $ne: "resolved" },
                }).session(session);

                if (!stillOpen) {
                    await ServiceModel.updateOne(
                        { _id: incident.serviceId, organizationId },
                        { $set: { currentStatus: "operational" } },
                        { session }
                    );
                }
            } else if (from === "resolved") {
                await ServiceModel.updateOne(
                    {
                        _id: incident.serviceId,
                        organizationId,
                        currentStatus: "operational",
                    },
                    { $set: { currentStatus: "degraded" } },
                    { session }
                );
            }
        });

        return updated!;
    } finally {
        await session.endSession();
    }
}