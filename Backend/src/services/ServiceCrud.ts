import type { HydratedDocument } from "mongoose";
import { ServiceModel, type IService } from "../models/Service.Model.ts";
import { ApiError } from "./ApiError.ts";

export async function createService(
    name: string,
    organizationId: string
): Promise<HydratedDocument<IService>> {
    try {
        return await ServiceModel.create({ name, organizationId });
    } catch (error: any) {
        if (error.code === 11000) {
            throw new ApiError(409, "A service with this name already exists");
        }
        throw error;
    }
}

export async function listServices(organizationId: string) {
    return ServiceModel.find({ organizationId }).sort({ name: 1 });
}