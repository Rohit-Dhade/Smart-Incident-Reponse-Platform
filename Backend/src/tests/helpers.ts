import type { Role } from "../types/role.ts";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import app from "../app.ts";
import { UserModel } from "../models/User.Model.ts";
import { MemberShipModel } from "../models/Membership.Model.ts";
import { makeSlug } from "../services/makeSlug.ts";

export const API = {
    register: "/api/v1/auth/register",
    services: "/api/v1/services",
    incidents: "/api/v1/incidents",
    status: "/api/v1/status",
    login: "/api/v1/auth/login",
    invitations: "/api/v1/invitations",
};

let replSet: MongoMemoryReplSet | undefined;

export async function startDb() {
    const testUri = process.env.MONGO_TEST_URI;

    if (testUri) {
        await mongoose.connect(testUri);

        if (!/test/i.test(mongoose.connection.name)) {
            const name = mongoose.connection.name;
            await mongoose.disconnect();
            throw new Error(`Refusing to run tests on database "${name}". Its name must contain "test".`);
        }
    } else {
        replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        await mongoose.connect(replSet.getUri());
    }

    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function stopDb() {
    await mongoose.disconnect();
    await replSet?.stop();
}

export async function clearDb() {
    await Promise.all(
        Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
    );
}

export interface Company {
    cookie: string;
    userId: string;
    organizationId: string;
    slug: string;
}

export async function registerCompany(orgName: string, email: string): Promise<Company> {
    const res = await request(app).post(API.register).send({
        organizationName: orgName,
        name: "TestAdmin",
        email,
        password: "password123",
    });

    if (res.status !== 201) {
        throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
    }

    const raw = res.headers["set-cookie"] as unknown as string[] | string;
    const cookie = (Array.isArray(raw) ? raw : [raw])
        .map((c) => c.split(";")[0])
        .find((c) => c?.startsWith("token="));
    if (!cookie) throw new Error("register did not set a token cookie");

    const user = await UserModel.findOne({ email }).lean();
    const membership = await MemberShipModel.findOne({ userId: user!._id }).lean();

    return {
        cookie,
        userId: String(user!._id),
        organizationId: String(membership!.organizationId),
        slug: makeSlug(orgName),
    };
}


export function cookieFrom(res: { headers: Record<string, any> }): string {
    const raw = res.headers["set-cookie"] as string[] | string | undefined;
    const cookie = (Array.isArray(raw) ? raw : [raw ?? ""])
        .map((c) => c?.split(";")[0])
        .find((c) => c?.startsWith("token="));
    if (!cookie) throw new Error("no token cookie in response");
    return cookie;
}

export async function addMember(company: Company, role: Role, email: string): Promise<Company> {
    const user = await UserModel.create({
        name: `Test ${role}`,
        email,
        passwordhash: "password123",
    });
    await MemberShipModel.create({
        userId: user._id,
        organizationId: company.organizationId,
        role,
    });

    const res = await request(app).post(API.login).send({ email, password: "password123" });
    if (res.status !== 200) {
        throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
    }

    return { ...company, cookie: cookieFrom(res), userId: String(user._id) };
}