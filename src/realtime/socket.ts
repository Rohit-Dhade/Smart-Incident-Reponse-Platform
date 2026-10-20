import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "../middleware/AuthMiddleware.ts";
import { OrganizationModel } from "../models/Organization.Model.ts";
import { findPublicOrg, buildPublicStatus } from "../services/PublicStatus.ts";

const publicRoom = (organizationId: string) => `public:${organizationId}`;
let io: Server | undefined;

const orgRoom = (organizationId: string) => `org:${organizationId}`;

export function initSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: { origin: process.env.CLIENT_URL, credentials: true },
    });

    io.use((socket, next) => {
        try {
            const cookies = parseCookie(socket.handshake.headers.cookie ?? "");
            const token = cookies.token;
            if (!token) return next(new Error("Unauthorized"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
            socket.data.user = decoded;
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