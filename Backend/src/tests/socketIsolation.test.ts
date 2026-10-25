import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import http from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { io as connectIo, type Socket } from "socket.io-client";
import app from "../app.ts";
import { initSocket } from "../realtime/socket.ts";
import { API, startDb, stopDb, clearDb, registerCompany, type Company } from "./helpers.ts";
import { INCIDENT_SEVERITIES } from "../types/incident.types.ts";

let httpServer: http.Server;
let ioServer: ReturnType<typeof initSocket>;
let baseUrl: string;
let acme: Company;
let beta: Company;
let serviceId: string; 
const opened: Socket[] = [];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until(check: () => boolean, ms = 3000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (check()) return;
        await sleep(25);
    }
    throw new Error("timed out waiting for the expected event");
}

function connectClient(namespace = "", cookie?: string): Promise<Socket> {
    const socket = connectIo(`${baseUrl}${namespace}`, {
        transports: ["websocket"],
        reconnection: false,
        forceNew: true,
        extraHeaders: cookie ? { cookie } : {},
    });
    opened.push(socket);
    return new Promise((resolve, reject) => {
        socket.on("connect", () => resolve(socket));
        socket.on("connect_error", (err) => reject(err));
    });
}


function record(socket: Socket) {
    const events: { name: string; data: any }[] = [];
    socket.onAny((name, data) => events.push({ name, data }));
    return events;
}

function subscribe(socket: Socket, slug: string): Promise<any> {
    return new Promise((resolve) => socket.emit("subscribe", slug, resolve));
}

async function openIncident(cookie: string) {
    const res = await request(app)
        .post(API.incidents)
        .set("Cookie", cookie)
        .send({ title: "Payments failing", severity: INCIDENT_SEVERITIES[0], serviceId });
    expect(res.status).toBe(201);
    return res.body.data._id as string;
}

beforeAll(async () => {
    await startDb();
    httpServer = http.createServer(app);
    ioServer = initSocket(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve)); // 0 = any free port
    baseUrl = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
    await new Promise<void>((resolve) => ioServer.close(() => resolve()));
    await stopDb();
});

beforeEach(async () => {
    await clearDb();
    acme = await registerCompany("Acme", "alice@acme.test");
    beta = await registerCompany("Beta", "bob@beta.test");

    const svc = await request(app).post(API.services).set("Cookie", acme.cookie).send({ name: "Payments API" });
    expect(svc.status).toBe(201);
    serviceId = svc.body.data._id;

    
    await sleep(700);
});

afterEach(async () => {
    opened.forEach((s) => s.close());
    opened.length = 0;
    await sleep(700); 
});

describe("internal live line (login required)", () => {
    it("rejects a connection with no login cookie", async () => {
        await expect(connectClient("")).rejects.toThrow("Unauthorized");
    });

    it("rejects a connection with a fake token", async () => {
        await expect(connectClient("", "token=not-a-real-token")).rejects.toThrow("Unauthorized");
    });

    it("the owner receives live events for its own incidents", async () => {
        const mine = await connectClient("", acme.cookie);
        const events = record(mine);
        await sleep(50);

        await openIncident(acme.cookie);
        await until(() => events.some((e) => e.name === "incident:created"));
        expect(events.find((e) => e.name === "incident:created")!.data.title).toBe("Payments failing");
    });

    it("another company hears nothing, not even one event", async () => {
        const acmeSocket = await connectClient("", acme.cookie);
        const betaSocket = await connectClient("", beta.cookie);
        const acmeEvents = record(acmeSocket);
        const betaEvents = record(betaSocket);
        await sleep(50);

        
        const id = await openIncident(acme.cookie);
        await request(app).patch(`${API.incidents}/${id}/status`).set("Cookie", acme.cookie).send({ status: "identified" });
        await request(app).post(`${API.incidents}/${id}/updates`).set("Cookie", acme.cookie).send({ message: "secret detail" });
        await request(app).post(`${API.incidents}/${id}/assign`).set("Cookie", acme.cookie).send({ userId: acme.userId });

        
        await until(() => acmeEvents.length >= 4);
        await sleep(500);

        expect(betaEvents).toHaveLength(0);
    });
});

describe("public live line (no login)", () => {
    it("anyone can watch a real status page and gets the current state at once", async () => {
        const watcher = await connectClient("/public");
        const res = await subscribe(watcher, acme.slug);

        expect(res.ok).toBe(true);
        expect(res.data.organization.slug).toBe(acme.slug);
        expect(res.data.services).toHaveLength(1);
    });

    it("an unknown page is refused", async () => {
        const watcher = await connectClient("/public");
        const res = await subscribe(watcher, "no-such-company");
        expect(res.ok).toBe(false);
    });

    it("a visitor who keeps guessing slugs gets disconnected", async () => {
        const watcher = await connectClient("/public");
        for (let i = 0; i < 11; i++) watcher.emit("subscribe", "nope");
        await until(() => watcher.disconnected);
    });

    it("watchers get a fresh snapshot when something changes", async () => {
        const watcher = await connectClient("/public");
        const events = record(watcher);
        await subscribe(watcher, acme.slug);

        await openIncident(acme.cookie);
        await until(() => events.some((e) => e.name === "status:snapshot"));

        const snapshot = events.find((e) => e.name === "status:snapshot")!.data;
        expect(snapshot.services[0].status).toBe("degraded");
        expect(snapshot.overall).toBe("partial_degradation");
    });

    it("another company's page stays silent", async () => {
        const betaWatcher = await connectClient("/public");
        const events = record(betaWatcher);
        await subscribe(betaWatcher, beta.slug);

        await openIncident(acme.cookie);
        await sleep(1200);

        expect(events.filter((e) => e.name === "status:snapshot")).toHaveLength(0);
    });

    it("internal notes send nothing, public notes send a snapshot without private data", async () => {
        const watcher = await connectClient("/public");
        const events = record(watcher);
        const snapshots = () => events.filter((e) => e.name === "status:snapshot");
        await subscribe(watcher, acme.slug);

        const id = await openIncident(acme.cookie);
        await until(() => snapshots().length === 1);

        await request(app)
            .post(`${API.incidents}/${id}/updates`)
            .set("Cookie", acme.cookie)
            .send({ message: "INTERNAL ONLY", visibility: "internal" });
        await sleep(1000);
        expect(snapshots()).toHaveLength(1);

        await request(app)
            .post(`${API.incidents}/${id}/updates`)
            .set("Cookie", acme.cookie)
            .send({ message: "We are looking into it", visibility: "public" });
        await until(() => snapshots().length === 2);

        const text = JSON.stringify(snapshots()[1]?.data);
        expect(text).toContain("We are looking into it");
        expect(text).not.toContain("INTERNAL ONLY");
        expect(text).not.toContain(acme.organizationId);
        expect(text).not.toContain("assignedTo");
    });
});