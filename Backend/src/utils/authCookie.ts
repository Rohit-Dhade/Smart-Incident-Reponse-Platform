import jwt from "jsonwebtoken";
import type { Response } from "express";
import type { Role } from "../types/role.ts";

export function setAuthCookie(
    res: Response,
    payload: { id: string; organizationId: string; role: Role }
) {
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
}