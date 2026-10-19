import mongoose, { type Document } from "mongoose";
import { makeSlug } from "../services/makeSlug.ts";

const stringField = {
    type: String,
    required: true,
    unique: true,
    trim: true,
};

export interface IOrganization extends Document {
    name: string;
    slug: string;
}

const OrganizationSchema = new mongoose.Schema<IOrganization>({
    name: stringField,

    slug: {
        type: String,
        required: true,
        unique: true,
    },
}, { timestamps: true });

OrganizationSchema.pre("validate", function () {
    if (this.isNew || this.isModified("name")) {
        this.slug = makeSlug(this.name);
    }
});

export const OrganizationModel = mongoose.model<IOrganization>(
    "Organization",
    OrganizationSchema
);