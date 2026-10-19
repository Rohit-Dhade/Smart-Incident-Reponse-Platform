import mongoose, { type HydratedDocument } from "mongoose";
import { IncidentModel, type IIncident } from "../models/Incident.Model.ts";
import { IncidentUpdateModel } from "../models/IncidentUpdate.Model.ts";
import { MemberShipModel } from "../models/MembershipModel.ts";
import { UserModel } from "../models/User.Model.ts";
import { ApiError } from "./ApiError.ts";
import type { Role } from "../types/role.ts";

const ASSIGNABLE_ROLES: Role[] = ["admin", "responder"];

interface AssignmentInput {
    incidentId: string;
    assigneeId: string;
    organizationId: string;
    actorId: string;
}

async function changeAssignment(
    { incidentId, assigneeId, organizationId, actorId }: AssignmentInput,
    action: "assign" | "unassign"
): Promise<HydratedDocument<IIncident>> {
    if (!mongoose.isValidObjectId(incidentId)) {
        throw new ApiError(404, "Incident not found");
    }
    if (!mongoose.isValidObjectId(assigneeId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const session = await mongoose.startSession();
    let updated: HydratedDocument<IIncident> | undefined;

    try {
        await session.withTransaction(async () => {
            const incident = await IncidentModel.findOne({
                _id: incidentId,
                organizationId,
            }).session(session);

            if (!incident) {
                throw new ApiError(404, "Incident not found");
            }

            if (incident.status === "resolved") {
                throw new ApiError(409, "Cannot change assignments on a resolved incident");
            }

            const isAssigned = incident.assignedTo.some((id) => id.equals(assigneeId));

            if (action === "assign") {
                if (isAssigned) {
                    throw new ApiError(409, "User is already assigned to this incident");
                }

                const membership = await MemberShipModel.exists({
                    userId: assigneeId,
                    organizationId,
                    role: { $in: ASSIGNABLE_ROLES },
                }).session(session);

                if (!membership) {
                    throw new ApiError(400, "This user cannot be assigned to incidents");
                }
            } else if (!isAssigned) {
                throw new ApiError(409, "User is not assigned to this incident");
            }

            const assignee = await UserModel.findById(assigneeId)
                .select("name")
                .session(session);
            const assigneeName = assignee?.name ?? "A former member";

            const result = await IncidentModel.findOneAndUpdate(
                { _id: incident._id, organizationId },
                action === "assign"
                    ? { $addToSet: { assignedTo: assigneeId } }
                    : { $pull: { assignedTo: assigneeId } },
                { new: true, session }
            );

            if (!result) {
                throw new ApiError(404, "Incident not found");
            }

            await IncidentUpdateModel.create(
                [
                    {
                        incidentId: incident._id,
                        organizationId,
                        authorId: actorId,
                        type: action === "assign" ? "assigned" : "unassigned",
                        targetUserId: assigneeId,
                        message:
                            action === "assign"
                                ? `${assigneeName} was assigned to this incident`
                                : `${assigneeName} was unassigned from this incident`,
                    },
                ],
                { session }
            );

            updated = result;
        });

        return updated!;
    } finally {
        await session.endSession();
    }
}

export const assignResponder = (input: AssignmentInput) => changeAssignment(input, "assign");
export const unassignResponder = (input: AssignmentInput) => changeAssignment(input, "unassign");