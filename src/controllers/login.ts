import type { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/User.Model.ts";
import { ApiError } from "../services/ApiError.ts";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { MemberShipModel } from "../models/MembershipModel.ts";

export async function login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email }).select("+passwordhash");
        if (!user) {
            return next(new ApiError(401, "Invalid email or password"));
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordhash);
        if (!isPasswordValid) {
            return next(new ApiError(401, "Invalid email or password"));
        }

        const membership = await MemberShipModel.findOne({ userId: user._id });

        if (!membership) {
            return next(new ApiError(403, "User is not a member of any organization"));
        }

        const token = jwt.sign({ id: user._id, organizationId: membership.organizationId, role: membership.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });
        return res.status(200).json({ name: user.name, email: user.email, message: "Login successful" });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(new ApiError(500, "Internal server error"));
    }
}