import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import crypto from "crypto";
import request from "supertest";
import app from "../app.ts";
import { API, startDb, stopDb, clearDb, registerCompany, type Company } from "./helpers.ts";
import { testOutbox } from "../services/mailer.ts";
import { PasswordResetModel } from "../models/PasswordReset.ts";
import { UserModel } from "../models/User.Model.ts";

const FORGOT = "/api/v1/auth/forgot-password";
const RESET = "/api/v1/auth/reset-password";
const ME = "/api/v1/auth/me";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hash = (t: string) => crypto.createHash("sha256").update(t).digest("hex");
const tokenFromMail = (text: string) => text.match(/token=([a-f0-9]{64})/)![1];

let acme: Company;

const login = (password: string) =>
    request(app).post(API.login).send({ email: "alice@acme.test", password });

async function requestToken() {
    testOutbox.length = 0;
    const res = await request(app).post(FORGOT).send({ email: "alice@acme.test" });
    expect(res.status).toBe(200);
    await vi.waitFor(() => expect(testOutbox).toHaveLength(1));
    return tokenFromMail(testOutbox[0]!.text);
}

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
    await clearDb();
    testOutbox.length = 0;
    acme = await registerCompany("Acme", "alice@acme.test");
});

describe("asking for a reset link", () => {
    it("gives the same answer for known and unknown emails, and emails only the known one", async () => {
        const known = await request(app).post(FORGOT).send({ email: "alice@acme.test" });
        const unknown = await request(app).post(FORGOT).send({ email: "nobody@acme.test" });

        expect(known.status).toBe(200);
        expect(unknown.status).toBe(200);
        expect(unknown.body).toEqual(known.body);

        await vi.waitFor(() => expect(testOutbox).toHaveLength(1));
        await sleep(300);
        expect(testOutbox).toHaveLength(1);
        expect(testOutbox[0]!.to).toBe("alice@acme.test");
    });

    it("keeps only the newest link", async () => {
        const first = await requestToken();
        const second = await requestToken();

        expect((await request(app).post(RESET).send({ token: first, password: "newpass123" })).status).toBe(400);
        expect((await request(app).post(RESET).send({ token: second, password: "newpass123" })).status).toBe(200);
    });
});

describe("choosing a new password", () => {
    it("works, the old password stops working, and a confirmation email goes out", async () => {
        const token = await requestToken();
        testOutbox.length = 0;

        const res = await request(app).post(RESET).send({ token, password: "brandnew456" });
        expect(res.status).toBe(200);

        expect((await login("password123")).status).toBe(401);
        expect((await login("brandnew456")).status).toBe(200);
        expect(testOutbox.some((m) => m.subject.includes("changed"))).toBe(true);
    });

    it("the link works only once", async () => {
        const token = await requestToken();
        expect((await request(app).post(RESET).send({ token, password: "brandnew456" })).status).toBe(200);
        expect((await request(app).post(RESET).send({ token, password: "another789" })).status).toBe(400);
    });

    it("refuses an expired link and leaves the password alone", async () => {
        const user = await UserModel.findOne({ email: "alice@acme.test" });
        const token = crypto.randomBytes(32).toString("hex");
        await PasswordResetModel.create({
            userId: user!._id,
            tokenHash: hash(token),
            expiresAt: new Date(Date.now() - 1000),
        });

        expect((await request(app).post(RESET).send({ token, password: "brandnew456" })).status).toBe(400);
        expect((await login("password123")).status).toBe(200);
    });

    it("refuses a made-up link and a too-short password", async () => {
        const fake = crypto.randomBytes(32).toString("hex");
        expect((await request(app).post(RESET).send({ token: fake, password: "brandnew456" })).status).toBe(400);

        const token = await requestToken();
        expect((await request(app).post(RESET).send({ token, password: "123" })).status).toBe(400);
        expect((await request(app).post(RESET).send({ token, password: "brandnew456" })).status).toBe(200);
    });
});

describe("sessions after a password change", () => {
    it("an older login cookie stops working", async () => {
        expect((await request(app).get(ME).set("Cookie", acme.cookie)).status).toBe(200);

        const token = await requestToken();
        await sleep(1100); 
        await request(app).post(RESET).send({ token, password: "brandnew456" });

        const res = await request(app).get(ME).set("Cookie", acme.cookie);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it("a new login after the change works", async () => {
        const token = await requestToken();
        await request(app).post(RESET).send({ token, password: "brandnew456" });

        const fresh = await login("brandnew456");
        expect(fresh.status).toBe(200);
    });
});