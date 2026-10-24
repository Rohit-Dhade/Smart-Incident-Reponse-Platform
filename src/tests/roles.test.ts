import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.ts";
import { API, startDb, stopDb, clearDb, registerCompany, addMember, type Company } from "./helpers.ts";
import { IncidentModel } from "../models/Incident.Model.ts";
import { INCIDENT_SEVERITIES } from "../types/incident.types.ts";

let admin: Company;
let responder: Company;
let viewer: Company;
let serviceId: string;
let incidentId: string;

type Send = (cookie: string) => Promise<{ status: number; body: any }>;

function expectForbidden(res: { status: number; body: any }) {
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
}

beforeAll(startDb);
afterAll(stopDb);

beforeEach(async () => {
    await clearDb();
    admin = await registerCompany("Acme", "alice@acme.test");
    responder = await addMember(admin, "responder", "rita@acme.test");
    viewer = await addMember(admin, "viewer", "victor@acme.test");

    const svc = await request(app).post(API.services).set("Cookie", admin.cookie).send({ name: "Payments API" });
    serviceId = svc.body.data._id;

    const inc = await request(app)
        .post(API.incidents)
        .set("Cookie", admin.cookie)
        .send({ title: "Payments failing", severity: INCIDENT_SEVERITIES[0], serviceId });
    incidentId = inc.body.data._id;
});

const writes: [string, Send][] = [
    ["create a service", (c) => request(app).post(API.services).set("Cookie", c).send({ name: "New one" })],
    ["create an incident", (c) =>
        request(app).post(API.incidents).set("Cookie", c)
            .send({ title: "x", severity: INCIDENT_SEVERITIES[0], serviceId: serviceId })],
    ["change a status", (c) =>
        request(app).patch(`${API.incidents}/${incidentId}/status`).set("Cookie", c).send({ status: "identified" })],
    ["post a note", (c) =>
        request(app).post(`${API.incidents}/${incidentId}/updates`).set("Cookie", c).send({ message: "hi" })],
    ["assign someone", (c) =>
        request(app).post(`${API.incidents}/${incidentId}/assign`).set("Cookie", c).send({ userId: admin.userId })],
    ["draft a postmortem", (c) =>
        request(app).post(`${API.incidents}/${incidentId}/postmortem/draft`).set("Cookie", c)],
    ["publish a postmortem", (c) =>
        request(app).post(`${API.incidents}/${incidentId}/postmortem/publish`).set("Cookie", c)],
];

describe("viewer: can look, cannot touch", () => {
    it("can read incidents and services", async () => {
        const incidents = await request(app).get(API.incidents).set("Cookie", viewer.cookie);
        expect(incidents.status).toBe(200);
        const services = await request(app).get(API.services).set("Cookie", viewer.cookie);
        expect(services.status).toBe(200);
    });

    it.each(writes)("cannot %s", async (_label, send) => {
        expectForbidden(await send(viewer.cookie));
    });

    it("leaves the incident unchanged after all those attempts", async () => {
        for (const [, send] of writes) await send(viewer.cookie);
        const incident = await IncidentModel.findById(incidentId);
        expect(incident!.status).toBe("investigating");
        expect(incident!.assignedTo).toHaveLength(0);
    });
});

describe("responder: can respond, cannot manage", () => {
    it("can create an incident and change its status", async () => {
        const created = await request(app)
            .post(API.incidents)
            .set("Cookie", responder.cookie)
            .send({ title: "From responder", severity: INCIDENT_SEVERITIES[0], serviceId });
        expect(created.status).toBe(201);

        const changed = await request(app)
            .patch(`${API.incidents}/${incidentId}/status`)
            .set("Cookie", responder.cookie)
            .send({ status: "identified" });
        expect(changed.status).toBe(200);
    });

    it("cannot create a service", async () => {
        expectForbidden(await writes[0]![1](responder.cookie));
    });

    it("cannot publish a postmortem", async () => {
        expectForbidden(await writes[6]![1](responder.cookie));
    });
});