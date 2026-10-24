import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express";
import { MemberShipModel } from "../models/Membership.Model.ts";

export interface AuthPayload {
    id: string;
    organizationId: string;
    role: "admin" | "responder" | "viewer";
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        const membership = await MemberShipModel.findOne({ userId: decoded.id }).lean();
        if (!membership) {
            return res.status(401).json({ success: false, message: 'No membership found.' });
        }

        req.user = {
            id: decoded.id,
            organizationId: String(membership.organizationId),
            role: membership.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};
