import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type { AuthPayload } from "../middleware/AuthMiddleware.ts";
import { OrganizationModel } from "../models/Organization.Model.ts";
import { findPublicOrg, buildPublicStatus } from "../services/PublicStatus.ts";
import { parseCookie as parse } from "cookie";   
import { verifySession } from "../utils/sessions.ts";

const publicRoom = (organizationId: string) => `public:${organizationId}`;
let io: Server | undefined;

const orgRoom = (organizationId: string) => `org:${organizationId}`;

export function initSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: { origin: process.env.CLIENT_URL, credentials: true },
    });

    io.use(async (socket, next) => {
        try {
            const cookies = parse(socket.handshake.headers.cookie ?? "");
            if (!cookies.token) return next(new Error("Unauthorized"));
            socket.data.user = await verifySession(cookies.token);
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        const user = socket.data.user as AuthPayload;
        socket.join(orgRoom(String(user.organizationId)));
    });

    const publicNs = io.of("/public");

    publicNs.on("connection", (socket) => {
        let attempts = 0;

        socket.on("subscribe", async (slug: unknown, ack?: (res: unknown) => void) => {
            const reply = typeof ack === "function" ? ack : () => { };

            attempts += 1;
            if (attempts > 10) {
                socket.disconnect(true);
                return;
            }

            if (typeof slug !== "string" || slug.length === 0 || slug.length > 60) {
                return reply({ ok: false, error: "Status page not found" });
            }

            try {
                const org = await findPublicOrg(slug);
                if (!org) {
                    return reply({ ok: false, error: "Status page not found" });
                }

                for (const room of [...socket.rooms]) {
                    if (room !== socket.id) await socket.leave(room);
                }
                await socket.join(publicRoom(String(org._id)));

                reply({ ok: true, data: await buildPublicStatus(org) });
            } catch (err) {
                console.error("Public subscribe failed:", err);
                reply({ ok: false, error: "Something went wrong" });
            }
        });
    });

    return io;
}

export function emitToOrg(organizationId: string, event: string, payload: unknown) {
    io?.to(orgRoom(String(organizationId))).emit(event, payload);
}

const pendingBroadcasts = new Map<string, NodeJS.Timeout>();

export function broadcastPublicStatus(organizationId: string) {
    if (!io) return;
    const key = String(organizationId);
    if (pendingBroadcasts.has(key)) return;

    pendingBroadcasts.set(
        key,
        setTimeout(async () => {
            pendingBroadcasts.delete(key);
            try {
                const room = io?.of("/public").adapter.rooms.get(publicRoom(key));
                if (!room || room.size === 0) return; // nobody watching, skip the database work

                const org = await OrganizationModel.findById(key).select("name slug").lean();
                if (!org) return;

                const snapshot = await buildPublicStatus(org);
                io?.of("/public").to(publicRoom(key)).emit("status:snapshot", snapshot);
            } catch (err) {
                console.error("Public broadcast failed:", err);
            }
        }, 500)
    );
}