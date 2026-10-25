import mongoose from "mongoose";
import { CreateMemberShip } from "../services/CreateMember.ts";
import { CreateUser } from "../services/CreateUser.ts";
import type { Request, Response, NextFunction } from "express";
import { CreateOrganization } from "../services/CreateOrganization.ts";
import { ApiError } from "../services/ApiError.ts";
import jwt from "jsonwebtoken";
import type { IUser } from "../models/User.Model.ts";

export async function register(req: Request, res: Response, next: NextFunction) {
    const { organizationName, name, email, password } = req.body;
    const session = await mongoose.startSession();
    let user!: IUser;
    try {
        await session.withTransaction(async () => {
            const organization = await CreateOrganization(organizationName, session);
            user = await CreateUser(name, email, password, session);
            await CreateMemberShip(user._id, organization._id, "admin", session);
        })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        return res.status(201).json({ name: user.name, email: user.email, message: "User registered successfully" });
    } catch (error: any) {
        console.error("[register] Error:", error?.message, error?.code, error?.name);

        if (error.code === 11000) {
            if (error.keyPattern?.email) {
                return next(new ApiError(409, "An Account with this email already exists"));
            }
            if (error.keyPattern?.slug) {
                return next(new ApiError(409, "An organization with this name already exists"));
            }
            return next(new ApiError(409, "Duplicate entry"));
        }

        if (error instanceof ApiError) {
            return next(error);
        }

        return next(new ApiError(500, "Internal server error"));
    } finally {
        await session.endSession();
    }
}