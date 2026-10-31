import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.ts";
import { API, startDb, stopDb, clearDb, registerCompany, type Company } from "./helpers.ts";
import { testOutbox } from "../services/mailer.ts";
import { invitationEmail } from "../services/emails/InvitationEmail.ts";

describe("invitation email text", () => {
    const base = {
        organizationName: "Acme",
        inviterName: "Alice",
        role: "responder",
        link: "http://localhost:5173/accept-invite?token=abc",
        expiresAt: new Date("2026-11-10T00:00:00Z"),
    };

    it("contains the link, the organization, and the role", () => {
        const { subject, text, html } = invitationEmail(base);
        expect(subject).toContain("Acme");
        expect(text).toContain(base.link);
        expect(html).toContain("responder");
    });

    it("escapes HTML typed by users", () => {
        const { html } = invitationEmail({ ...base, organizationName: "<script>alert(1)</script>" });
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });

    it("keeps line breaks out of the subject", () => {
        const { subject } = invitationEmail({ ...base, inviterName: "Alice\r\nBcc: evil@x.test" });
        expect(subject).not.toMatch(/[\r\n]/);
    });
});

describe("sending invitations by email", () => {
    let admin: Company;
    const tokenOf = (link: string) => new URL(link).searchParams.get("token")!;

    const accept = (token: string) =>
        request(app)
            .post(`${API.invitations}/accept`)
            .send({ token, name: "Rita", password: "password123" });

    beforeAll(startDb);
    afterAll(stopDb);
    beforeEach(async () => {
        await clearDb();
        testOutbox.length = 0;
        admin = await registerCompany("Acme", "alice@acme.test");
    });

    it("emails the link to the invited person", async () => {
        const res = await request(app)
            .post(API.invitations)
            .set("Cookie", admin.cookie)
            .send({ email: "rita@acme.test", role: "responder" });

        expect(res.status).toBe(201);
        expect(res.body.data.emailSent).toBe(true);
        expect(testOutbox).toHaveLength(1);
        expect(testOutbox[0]?.to).toBe("rita@acme.test");
        expect(testOutbox[0]?.text).toContain(res.body.data.inviteLink);
    });

    it("sends no email when the invitation is refused", async () => {
        const res = await request(app)
            .post(API.invitations)
            .set("Cookie", admin.cookie)
            .send({ email: "not-an-email", role: "responder" });

        expect(res.status).toBe(400);
        expect(testOutbox).toHaveLength(0);
    });

    it("a viewer cannot send invitations", async () => {
        const { addMember } = await import("./helpers.ts");
        const viewer = await addMember(admin, "viewer", "victor@acme.test");

        const res = await request(app)
            .post(API.invitations)
            .set("Cookie", viewer.cookie)
            .send({ email: "rita@acme.test", role: "responder" });

        expect(res.status).toBe(403);
        expect(testOutbox).toHaveLength(0);
    });

    it("resend gives a new link, and the old one stops working", async () => {
        const first = await request(app)
            .post(API.invitations)
            .set("Cookie", admin.cookie)
            .send({ email: "rita@acme.test", role: "responder" });
        const oldToken = tokenOf(first.body.data.inviteLink);

        const again = await request(app)
            .post(`${API.invitations}/${first.body.data.id}/resend`)
            .set("Cookie", admin.cookie);
        expect(again.status).toBe(200);
        expect(testOutbox).toHaveLength(2);

        const newToken = tokenOf(again.body.data.inviteLink);
        expect(newToken).not.toBe(oldToken);

        expect((await accept(oldToken)).status).toBe(400);
        expect((await accept(newToken)).status).toBe(200);
    });

    it("another company cannot resend our invitation", async () => {
        const first = await request(app)
            .post(API.invitations)
            .set("Cookie", admin.cookie)
            .send({ email: "rita@acme.test", role: "responder" });
        const beta = await registerCompany("Beta", "bob@beta.test");
        testOutbox.length = 0;

        const res = await request(app)
            .post(`${API.invitations}/${first.body.data.id}/resend`)
            .set("Cookie", beta.cookie);

        expect(res.status).toBe(404);
        expect(testOutbox).toHaveLength(0);
    });
});