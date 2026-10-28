import jwt from "jsonwebtoken";
import type { Response, CookieOptions } from "express";
import type { Role } from "../types/role.ts";

const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};

export function setAuthCookie(
    res: Response,
    payload: { id: string; organizationId: string; role: Role }
) {
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.cookie("token", token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
}

export function clearAuthCookie(res: Response) {
    res.clearCookie("token", cookieOptions);
}