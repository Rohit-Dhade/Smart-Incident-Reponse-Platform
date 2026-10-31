import mongoose, { type Document } from "mongoose";

export interface IPasswordReset extends Document {
    userId: mongoose.Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
}

const PasswordResetSchema = new mongoose.Schema<IPasswordReset>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

PasswordResetSchema.index({ tokenHash: 1 }, { unique: true });
PasswordResetSchema.index({ userId: 1 });

PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetModel = mongoose.model<IPasswordReset>("PasswordReset", PasswordResetSchema);