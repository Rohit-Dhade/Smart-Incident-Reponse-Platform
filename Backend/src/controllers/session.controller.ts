import type { Request, Response } from "express";
import { getCurrentUser } from "../services/currentUser.ts";
import { clearAuthCookie } from "../utils/authCookie.ts";

export async function meHandler(req: Request, res: Response) {
    const data = await getCurrentUser(req.user!.id, req.user!.organizationId);
    return res.status(200).json({ success: true, data });
}

export function logoutHandler(_req: Request, res: Response) {
    clearAuthCookie(res);
    return res.status(200).json({ success: true, message: "Logged out" });
}