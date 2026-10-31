import type { Request, Response } from "express";
import { requestPasswordReset, resetPassword } from "../services/PasswordReset.ts";
import { clearAuthCookie } from "../utils/authCookie.ts";

export async function forgotPasswordHandler(req: Request, res: Response) {

    void requestPasswordReset(req.body.email).catch((err) =>
        console.error("Password reset request failed:", err)
    );

    return res.status(200).json({
        success: true,
        message: "If an account exists for that email, a reset link is on its way.",
    });
}

export async function resetPasswordHandler(req: Request, res: Response) {
    await resetPassword(req.body.token, req.body.password);
    clearAuthCookie(res);
    return res.status(200).json({
        success: true,
        message: "Password updated. Please log in with your new password.",
    });
}