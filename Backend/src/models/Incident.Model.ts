import mongoose, { type Document } from "mongoose";
import { INCIDENT_STATUSES, INCIDENT_SEVERITIES, type IncidentStatus, type IncidentSeverity } from "../types/incident.types.ts";

export interface IIncident extends Document {
    title: string;
    description?: string;
    organizationId: mongoose.Types.ObjectId;
    serviceId: mongoose.Types.ObjectId;
    status: IncidentStatus;
    severity: IncidentSeverity;
    assignedTo: mongoose.Types.ObjectId[];
    resolvedAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const IncidentSchema = new mongoose.Schema<IIncident>({
    title: {
        type: String,
        trim: true,
        required:true
    },
    description: {
        type: String,
        required: false,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
    status: {
        type: String,
        enum: INCIDENT_STATUSES,
        default: "investigating",
    },
    severity: {
        type: String,
        enum: INCIDENT_SEVERITIES,
        default: "high",
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    }],
    resolvedAt: {
        type: Date,
        required: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, { timestamps: true })

IncidentSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
IncidentSchema.index({ serviceId: 1, status: 1 })

export const IncidentModel = mongoose.model<IIncident>("Incident", IncidentSchema);
