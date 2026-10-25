import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import app from "../app.ts";
import { API, startDb, stopDb, clearDb } from "./helpers.ts";
import { OrganizationModel } from "../models/Organization.Model.ts";
import { UserModel } from "../models/User.Model.ts";
import { MemberShipModel } from "../models/Membership.Model.ts";

const register = (organizationName: string, email: string) =>
    request(app).post(API.register).send({
        organizationName,
        name: "TestAdmin",
        email,
        password: "password123",
    });

async function expectNothingSaved() {
    expect(await OrganizationModel.countDocuments()).toBe(0);
    expect(await UserModel.countDocuments()).toBe(0);
    expect(await MemberShipModel.countDocuments()).toBe(0);
}

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);
afterEach(() => vi.restoreAllMocks());

describe("register is all-or-nothing", () => {
    it("saves nothing if the LAST step (creating the membership) fails", async () => {
        const spy = vi
            .spyOn(MemberShipModel as any, "create")
            .mockRejectedValue(new Error("simulated failure"));

        const res = await register("Acme", "alice@acme.test");

        expect(spy).toHaveBeenCalled(); 
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.headers["set-cookie"]).toBeUndefined(); 
        await expectNothingSaved();
    });

    it("the same signup works afterwards, so nothing was left behind", async () => {
        const spy = vi
            .spyOn(MemberShipModel as any, "create")
            .mockRejectedValue(new Error("simulated failure"));
        expect((await register("Acme", "alice@acme.test")).status).toBe(500);
        spy.mockRestore();

        const retry = await register("Acme", "alice@acme.test");
        expect(retry.status).toBe(201);
        expect(await OrganizationModel.countDocuments()).toBe(1);
        expect(await UserModel.countDocuments()).toBe(1);
        expect(await MemberShipModel.countDocuments()).toBe(1);
    });

    it("a duplicate email leaves no half-made organization behind", async () => {
        expect((await register("Acme", "alice@acme.test")).status).toBe(201);

        const res = await register("Beta", "alice@acme.test");

        expect(res.status).toBe(409);
        expect(res.body.message).toContain("email");
        expect(await OrganizationModel.countDocuments({ name: "Beta" })).toBe(0);
        expect(await UserModel.countDocuments()).toBe(1);
        expect(await MemberShipModel.countDocuments()).toBe(1);
    });

    it("a duplicate organization name leaves no user behind", async () => {
        expect((await register("Acme", "alice@acme.test")).status).toBe(201);

        const res = await register("ACME", "bob@other.test");

        expect(res.status).toBe(409);
        expect(res.body.message).toContain("organization");
        expect(await UserModel.countDocuments({ email: "bob@other.test" })).toBe(0);
        expect(await OrganizationModel.countDocuments()).toBe(1);
    });

    it("invalid input is rejected before the database is touched", async () => {
        const res = await request(app).post(API.register).send({
            organizationName: "Acme",
            name: "TestAdmin",
            email: "not-an-email",
            password: "123",
        });

        expect(res.status).toBe(400);
        await expectNothingSaved();
    });
});