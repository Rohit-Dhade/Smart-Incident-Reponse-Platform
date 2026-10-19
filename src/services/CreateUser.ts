import { UserModel, type IUser } from "../models/User.Model.ts";
import { ApiError } from "./ApiError.ts";
import type { ClientSession } from "mongoose";

export async function CreateUser(
    name: string,
    email: string,
    password: string,
    session: ClientSession
): Promise<IUser> {
    const [user] = await UserModel.create(
        [{ name, email, passwordhash: password }],
        { session }
    );

    if (!user) {
        throw new ApiError(500, "Failed to create user");
    }

    return user;
}