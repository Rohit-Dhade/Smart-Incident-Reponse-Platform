import { Router } from "express";
import rateLimit from "express-rate-limit";
import { changeStatusValidator } from "../validation/incidentStatusValidator.ts";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import { requireRole } from "../middleware/requireRole.ts";
import { createIncidentHandler } from "../controllers/Incident.controller.ts";
import { createIncidentValidator } from "../validation/Incident.validator.ts";
import type { Role } from "../types/role.ts";
import { getIncidentsHandler, getIncidentByIdHandler, updateIncidentStatus } from "../controllers/Incident.controller.ts";
import { assignHandler, unassignHandler, postNoteHandler } from "../controllers/Incident.controller.ts";
import { assignValidator, postNoteValidator } from "../validation/Incident.validator.ts";
import { draftHandler, getHandler, editHandler, publishHandler } from "../controllers/Postmortem.controller.ts";
import { editPostmortemValidator } from "../validation/Postmortem.validator.ts";

const IncidentRouter = Router();
const canRespond = requireRole(["admin", "responder"] as Role[]);
const canView = requireRole(["admin", "responder", "viewer"] as Role[]);
const draftLimiter = process.env.NODE_ENV === "test"
    ? (_req: any, _res: any, next: any) => next()
    : rateLimit({ windowMs: 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

IncidentRouter.post("/", authMiddleware, canRespond, createIncidentValidator, createIncidentHandler);
IncidentRouter.get("/", authMiddleware, canView, getIncidentsHandler);
IncidentRouter.get("/:id", authMiddleware, canView, getIncidentByIdHandler);
IncidentRouter.patch("/:id/status", authMiddleware, canRespond, changeStatusValidator, updateIncidentStatus);
IncidentRouter.post("/:id/assign", authMiddleware, canRespond, assignValidator, assignHandler);
IncidentRouter.delete("/:id/assign/:userId", authMiddleware, canRespond, unassignHandler);
IncidentRouter.post("/:id/updates", authMiddleware, canRespond, postNoteValidator, postNoteHandler);
IncidentRouter.post("/:id/postmortem/draft", authMiddleware, canRespond, draftLimiter, draftHandler);
IncidentRouter.get("/:id/postmortem", authMiddleware, canView, getHandler);
IncidentRouter.patch("/:id/postmortem", authMiddleware, canView, editPostmortemValidator, editHandler);
IncidentRouter.post("/:id/postmortem/publish", authMiddleware, requireRole(["admin"]), publishHandler);

export default IncidentRouter;