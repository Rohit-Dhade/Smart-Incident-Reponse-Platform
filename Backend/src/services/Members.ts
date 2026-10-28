import mongoose from "mongoose";
import { MemberShipModel } from "../models/Membership.Model.ts";

type PopulatedUser = { _id: mongoose.Types.ObjectId; name: string; email: string };

export async function listMembers(organizationId: string) {
    const memberships = await MemberShipModel.find({ organizationId })
        .populate<{ userId: PopulatedUser | null }>("userId", "name email")
        .sort({ _id: 1 })
        .lean();

    return memberships
        .filter((m) => m.userId) 
        .map((m) => ({
            userId: m.userId!._id,
            name: m.userId!.name,
            email: m.userId!.email,
            role: m.role,
        }));
}