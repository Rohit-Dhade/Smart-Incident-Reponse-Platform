import mongoose, { type Document } from "mongoose";
import { SERVICE_STATUSES, type ServiceStatus } from "../types/service.types.ts";

export interface IService extends Document {
    name: string;
    organizationId: mongoose.Types.ObjectId;
    currentStatus: ServiceStatus;
}

const ServiceSchema = new mongoose.Schema<IService>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    currentStatus: {
        type: String,
        enum: SERVICE_STATUSES,
        default: "operational",
    }
}, { timestamps: true })


ServiceSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const ServiceModel = mongoose.model<IService>("Service", ServiceSchema);