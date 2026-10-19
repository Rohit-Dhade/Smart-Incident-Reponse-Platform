import type { ClientSession } from "mongoose"
import { OrganizationModel } from "../models/Organization.Model.ts";
import { ApiError } from "./ApiError.ts";
import { makeSlug } from "./makeSlug.ts";

export async function CreateOrganization(
    organizationName: string,
    session: ClientSession
) {
    const organization = new OrganizationModel({
        name: organizationName,
        slug: makeSlug(organizationName),
    });
    await organization.save({ session });

    if (!organization) {
        throw new ApiError(500, "Failed to create organization");
    }

    return organization;
}