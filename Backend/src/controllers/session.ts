import type { Request, Response } from "express";
import { OrganizationModel } from "../models/Organization.Model.ts";
import { UserModel } from "../models/User.Model.ts";
import { ApiError } from "../services/ApiError.ts";

export async function me(req: Request, res: Response) {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    const [user, organization] = await Promise.all([
        UserModel.findById(req.user.id).select("name email").lean(),
        OrganizationModel.findById(req.user.organizationId).select("name slug").lean(),
    ]);

    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    return res.status(200).json({
        success: true,
        data: {
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
            },
            organization: {
                id: String(organization._id),
                name: organization.name,
                slug: organization.slug,
            },
            role: req.user.role,
        },
    });
}

export function logout(_req: Request, res: Response) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
}
