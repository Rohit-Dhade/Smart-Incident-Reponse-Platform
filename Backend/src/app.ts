import cookieParser from 'cookie-parser';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from "path";
import { errorHandler } from './middleware/ErrorMiddleware.ts';
import registerRouter from "./routes/Auth.Routes.ts";
import incidentRouter from "./routes/Incident.Routes.ts";
import ServiceRouter from "./routes/Service.Routes.ts";
import statusRouter from "./routes/Status.Routes.ts";
import invitationRouter from './routes/Invitation.Routes.ts';
import memberRouter from './routes/Members.Route.ts';

const app = express();
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 0));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({ status: dbReady ? "ok" : "unavailable" });
});

app.use("/api/v1/auth", registerRouter);
app.use("/api/v1/incidents", incidentRouter);
app.use("/api/v1/services", ServiceRouter);
app.use("/api/v1/status", statusRouter);
app.use("/api/v1/invitations", invitationRouter);
app.use("/api/v1/members", memberRouter);


if (process.env.SERVE_CLIENT === "true") {
    const clientDist = path.resolve(process.cwd(), "client-dist");
    app.use(express.static(clientDist));

    app.get(/^\/(?!api\/|socket\.io\/).*/, (_req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
    });
}


app.use(errorHandler);

export default app;