import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.Model.ts";
import { ApiError } from "../services/ApiError.ts";
import type { AuthPayload } from "../middleware/AuthMiddleware.ts";

export async function verifySession(token: string): Promise<AuthPayload> {
    let decoded: AuthPayload & { iat: number };
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload & { iat: number };
    } catch {
        throw new ApiError(401, "Your session is invalid or has expired, please log in again");
    }

    const user = await UserModel.findById(decoded.id).select("passwordChangedAt").lean();
    if (!user) {
        throw new ApiError(401, "Your session is no longer valid, please log in again");
    }

    if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
        throw new ApiError(401, "Your password was changed, please log in again");
    }

    return { id: decoded.id, organizationId: decoded.organizationId, role: decoded.role };
}