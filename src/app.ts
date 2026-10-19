import cookieParser from 'cookie-parser';
import 'dotenv/config';
import express from 'express';
import { errorHandler } from './middleware/ErrorMiddleware.ts';
import registerRouter from "./routes/Auth.Routes.ts";
import requiredRoleRouter from './routes/requiredRole.Route.ts';
import incidentRouter from "./routes/Incident.Routes.ts";
import ServiceRouter from "./routes/Service.Routes.ts";
import statusRouter from "./routes/Status.Routes.ts";

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use("/api/v1/auth", registerRouter);
app.use("/api/v1/role", requiredRoleRouter);
app.use("/api/v1/incidents", incidentRouter);
app.use("/api/v1/services", ServiceRouter);
app.use("/api/v1/status", statusRouter);


app.use(errorHandler);

export default app;