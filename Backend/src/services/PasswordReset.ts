import crypto from "crypto";
import mongoose from "mongoose";
import { UserModel } from "../models/User.Model.ts";
import { PasswordResetModel } from "../models/PasswordReset.ts";
import { ApiError } from "./ApiError.ts";
import { sendMail } from "./mailer.ts";
import { resetPasswordEmail, passwordChangedEmail } from "./emails/PasswordEmail.ts";

const RESET_MINUTES = 60;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(email: string) {
    const user = await UserModel.findOne({ email }).select("name email").lean();
    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");

    await PasswordResetModel.deleteMany({ userId: user._id });
    await PasswordResetModel.create({
        userId: user._id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
    });

    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    const mail = resetPasswordEmail({ name: user.name, link, minutes: RESET_MINUTES });
    await sendMail({ to: user.email, ...mail });
}

export async function resetPassword(token: string, newPassword: string) {
    const session = await mongoose.startSession();
    let who: { name: string; email: string } | undefined;

    try {
        await session.withTransaction(async () => {
            const reset = await PasswordResetModel.findOneAndDelete(
                { tokenHash: hashToken(token), expiresAt: { $gt: new Date() } },
                { session }
            );
            if (!reset) {
                throw new ApiError(400, "This reset link is invalid or has expired");
            }

            const user = await UserModel.findById(reset.userId).select("+passwordhash").session(session);
            if (!user) {
                throw new ApiError(400, "This reset link is invalid or has expired");
            }

            user.passwordhash = newPassword;
            user.passwordChangedAt = new Date();
            await user.save({ session });

            await PasswordResetModel.deleteMany({ userId: user._id }, { session });

            who = { name: user.name, email: user.email };
        });
    } finally {
        await session.endSession();
    }

    const mail = passwordChangedEmail({ name: who!.name });
    await sendMail({ to: who!.email, ...mail });
}