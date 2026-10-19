import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "../middleware/AuthMiddleware.ts"; // make sure AuthPayload is exported

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

    return io;
}

export function emitToOrg(organizationId: string, event: string, payload: unknown) {
    io?.to(orgRoom(String(organizationId))).emit(event, payload);
}