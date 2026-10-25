
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../services/ApiError.ts";
import type { Role } from "../types/role.ts";

export const requireRole = (allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized");
        }
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            throw new ApiError(403, "Forbidden");
        }
        next();
    }
}