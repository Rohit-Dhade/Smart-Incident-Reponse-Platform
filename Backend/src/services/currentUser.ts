import { UserModel } from "../models/User.Model.ts";
import { OrganizationModel } from "../models/Organization.Model.ts";
import { MemberShipModel } from "../models/Membership.Model.ts";
import { ApiError } from "../services/ApiError.ts";

export async function getCurrentUser(userId: string, organizationId: string) {
    const [user, organization, membership] = await Promise.all([
        UserModel.findById(userId).select("name email").lean(),
        OrganizationModel.findById(organizationId).select("name slug").lean(),
        MemberShipModel.findOne({ userId, organizationId }).select("role").lean(),
    ]);

    if (!user || !organization || !membership) {
        throw new ApiError(401, "Your session is no longer valid, please log in again");
    }

    return {
        user: { id: user._id, name: user.name, email: user.email },
        organization: { id: organization._id, name: organization.name, slug: organization.slug },
        role: membership.role,
    };
}