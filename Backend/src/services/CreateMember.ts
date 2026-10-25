import type { ClientSession } from "mongoose"
import { MemberShipModel } from "../models/Membership.Model.ts";
import { ApiError } from "./ApiError.ts";
import mongoose from "mongoose"
import type { Role } from "../types/role.ts";

export async function CreateMemberShip(
    userId: mongoose.Types.ObjectId,
    organizationId: mongoose.Types.ObjectId,
    role: Role,
    session: ClientSession
) {
    const [membership] = await MemberShipModel.create(
        [{ userId, organizationId, role }],
        { session }
    );

    if (!membership) {
        throw new ApiError(500, "Failed to create membership");
    }

    return membership;
}