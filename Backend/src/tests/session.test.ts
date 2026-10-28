import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.ts";
import { API, startDb, stopDb, clearDb, registerCompany, type Company } from "./helpers.ts";

const ME = "/api/v1/auth/me";
const LOGOUT = "/api/v1/auth/logout";

let acme: Company;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
    await clearDb();
    acme = await registerCompany("Acme", "alice@acme.test");
});

describe("who am I", () => {
    it("returns the logged-in person and organization", async () => {
        const res = await request(app).get(ME).set("Cookie", acme.cookie);
        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe("alice@acme.test");
        expect(res.body.data.organization.slug).toBe(acme.slug);
        expect(res.body.data.role).toBe("admin");
        expect(JSON.stringify(res.body)).not.toContain("passwordhash");
    });

    it("rejects a request with no cookie", async () => {
        expect((await request(app).get(ME)).status).toBe(401);
    });

    it("rejects a token whose membership no longer exists", async () => {
        const { MemberShipModel } = await import("../models/Membership.Model.ts");
        await MemberShipModel.deleteMany({});
        expect((await request(app).get(ME).set("Cookie", acme.cookie)).status).toBe(401);
    });
});

describe("logout", () => {
    it("clears the cookie", async () => {
        const res = await request(app).post(LOGOUT);
        expect(res.status).toBe(200);
        const cookies = ([] as string[]).concat((res.headers["set-cookie"] as any) ?? []);
        expect(cookies.some((c) => c.startsWith("token=;"))).toBe(true);
    });
});