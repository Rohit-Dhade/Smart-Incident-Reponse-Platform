import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../services/ApiError.ts";
import { verifySession } from "../utils/sessions.ts";

export interface AuthPayload {
    id: string;
    organizationId: string;
    role: "admin" | "responder" | "viewer";
}

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) {
        throw new ApiError(401, "Please log in to continue");
    }
    req.user = await verifySession(token);
    next();
};
