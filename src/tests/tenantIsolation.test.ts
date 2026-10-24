import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.ts";
import { API, startDb, stopDb, clearDb, registerCompany, type Company } from "./helpers.ts";
import { IncidentModel } from "../models/Incident.Model.ts";
import { IncidentUpdateModel } from "../models/IncidentUpdate.Model.ts";
import { PostmortemModel } from "../models/Postmortem.Model.ts";
import { INCIDENT_SEVERITIES } from "../types/incident.types.ts";

let A: Company;
let B: Company;
let serviceA: string;
let incidentA: string;

function expectRejected(res: { status: number; body: any }, status: number) {
    expect(res.status).toBe(status);
    expect(res.body.success).toBe(false);
}

function mustBe(res: { status: number; body: any }, status: number, what: string) {
    if (res.status !== status) {
        throw new Error(`${what} failed: ${res.status} ${JSON.stringify(res.body)}`);
    }
}

beforeAll(startDb);
afterAll(stopDb);

beforeEach(async () => {
    await clearDb();
    A = await registerCompany("Acme", "alice@acme.test");
    B = await registerCompany("Beta", "bob@beta.test");

    const svc = await request(app)
        .post(API.services)
        .set("Cookie", A.cookie)
        .send({ name: "Payments API" });
    mustBe(svc, 201, "create service");
    serviceA = svc.body.data._id;

    const inc = await request(app)
        .post(API.incidents)
        .set("Cookie", A.cookie)
        .send({ title: "Payments failing", severity: INCIDENT_SEVERITIES[0], serviceId: serviceA });
    mustBe(inc, 201, "create incident");
    incidentA = inc.body.data._id;
});

describe("sanity: the owner can use their own data", () => {
    // if these fail, the other tests would pass for the wrong reason
    it("Acme can list and read its own incident", async () => {
        const list = await request(app).get(API.incidents).set("Cookie", A.cookie);
        expect(list.status).toBe(200);
        expect(JSON.stringify(list.body)).toContain(incidentA);

        const one = await request(app).get(`${API.incidents}/${incidentA}`).set("Cookie", A.cookie);
        expect(one.status).toBe(200);
    });

    it("Acme can change status and post a note", async () => {
        const status = await request(app)
            .patch(`${API.incidents}/${incidentA}/status`)
            .set("Cookie", A.cookie)
            .send({ status: "identified" });
        expect(status.status).toBe(200);

        const note = await request(app)
            .post(`${API.incidents}/${incidentA}/updates`)
            .set("Cookie", A.cookie)
            .send({ message: "Found the cause" });
        expect(note.status).toBe(201);
    });
});

describe("Beta cannot READ Acme's data", () => {
    it("does not see Acme's incident in its list", async () => {
        const res = await request(app).get(API.incidents).set("Cookie", B.cookie);
        expect(res.status).toBe(200);
        expect(JSON.stringify(res.body)).not.toContain(incidentA);
    });

    it("gets 404 when opening Acme's incident by id", async () => {
        const res = await request(app).get(`${API.incidents}/${incidentA}`).set("Cookie", B.cookie);
        expectRejected(res, 404);
    });

    it("does not see Acme's services", async () => {
        const res = await request(app).get(API.services).set("Cookie", B.cookie);
        expect(res.status).toBe(200);
        expect(JSON.stringify(res.body)).not.toContain(serviceA);
    });
});

describe("Beta cannot CHANGE Acme's data", () => {
    it("cannot change the status of Acme's incident", async () => {
        const res = await request(app)
            .patch(`${API.incidents}/${incidentA}/status`)
            .set("Cookie", B.cookie)
            .send({ status: "identified" });
        expectRejected(res, 404);

        const incident = await IncidentModel.findById(incidentA);
        expect(incident!.status).toBe("investigating"); // unchanged
    });

    it("cannot post a note on Acme's incident", async () => {
        const before = await IncidentUpdateModel.countDocuments({ incidentId: incidentA });

        const res = await request(app)
            .post(`${API.incidents}/${incidentA}/updates`)
            .set("Cookie", B.cookie)
            .send({ message: "hello from Beta" });
        expectRejected(res, 404);

        const after = await IncidentUpdateModel.countDocuments({ incidentId: incidentA });
        expect(after).toBe(before);
    });

    it("cannot assign itself to Acme's incident", async () => {
        const res = await request(app)
            .post(`${API.incidents}/${incidentA}/assign`)
            .set("Cookie", B.cookie)
            .send({ userId: B.userId });
        expectRejected(res, 404);

        const incident = await IncidentModel.findById(incidentA);
        expect(incident!.assignedTo).toHaveLength(0);
    });

    it("cannot open an incident on Acme's service", async () => {
        const res = await request(app)
            .post(API.incidents)
            .set("Cookie", B.cookie)
            .send({ title: "Sneaky", severity: INCIDENT_SEVERITIES[0], serviceId: serviceA });
        expectRejected(res, 404);

        expect(await IncidentModel.countDocuments({ organizationId: B.organizationId })).toBe(0);
    });
});

describe("Acme's own admin cannot pull in Beta's people or forge a tenant", () => {
    it("cannot assign a user from another company", async () => {
        const res = await request(app)
            .post(`${API.incidents}/${incidentA}/assign`)
            .set("Cookie", A.cookie)
            .send({ userId: B.userId });
        expectRejected(res, 400);

        const incident = await IncidentModel.findById(incidentA);
        expect(incident!.assignedTo).toHaveLength(0);
    });

    it("ignores an organizationId sent in the request body", async () => {
        const res = await request(app)
            .post(API.incidents)
            .set("Cookie", A.cookie)
            .send({
                title: "Forged",
                severity: INCIDENT_SEVERITIES[0],
                serviceId: serviceA,
                organizationId: B.organizationId, // the forgery
            });
        expect(res.status).toBe(201);

        const saved = await IncidentModel.findById(res.body.data._id);
        expect(String(saved!.organizationId)).toBe(A.organizationId);
    });
});

describe("postmortems are isolated too", () => {
    it("Beta cannot read, edit, or publish Acme's postmortem", async () => {
        const pm = await PostmortemModel.create({
            incidentId: incidentA,
            organizationId: A.organizationId,
            summary: "Original summary",
            generatedBy: A.userId,
        });
        const url = `${API.incidents}/${incidentA}/postmortem`;

        expectRejected(await request(app).get(url).set("Cookie", B.cookie), 404);
        expectRejected(
            await request(app).patch(url).set("Cookie", B.cookie).send({ summary: "hacked" }),
            404
        );
        expectRejected(await request(app).post(`${url}/publish`).set("Cookie", B.cookie), 404);

        const after = await PostmortemModel.findById(pm._id);
        expect(after!.summary).toBe("Original summary");
        expect(after!.status).toBe("draft");
    });
});

describe("authentication and the public page", () => {
    it("rejects requests with no login cookie", async () => {
        const res = await request(app).get(API.incidents);
        expect(res.status).toBe(401);
    });

    it("the public status page leaks no internal details", async () => {
        await request(app)
            .post(`${API.incidents}/${incidentA}/updates`)
            .set("Cookie", A.cookie)
            .send({ message: "SECRET internal detail", visibility: "internal" });

        const res = await request(app).get(`${API.status}/${A.slug}`); // no cookie
        expect(res.status).toBe(200);

        const text = JSON.stringify(res.body);
        expect(text).not.toContain("SECRET");
        expect(text).not.toContain(A.organizationId);
        expect(text).not.toContain("assignedTo");
        expect(res.body.data.incidents).toEqual([]); // no public update yet
    });
});