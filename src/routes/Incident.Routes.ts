import { Router } from "express";
import { changeStatusValidator } from "../validation/incidentStatusValidator.ts";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import { requireRole } from "../middleware/requireRole.ts";
import { createIncidentHandler } from "../controllers/Incident.controller.ts";
import { createIncidentValidator } from "../validation/Incident.validator.ts";
import type { Role } from "../types/role.ts";
import { getIncidentsHandler, getIncidentByIdHandler, updateIncidentStatus } from "../controllers/Incident.controller.ts";
import { assignHandler, unassignHandler, postNoteHandler } from "../controllers/Incident.controller.ts";
import { assignValidator, postNoteValidator } from "../validation/Incident.validator.ts";

const IncidentRouter = Router();
const canRespond = requireRole(["admin", "responder"] as Role[]);
const canView = requireRole(["admin", "responder", "viewer"] as Role[]);

IncidentRouter.post("/updateIncidentStatus/:id", authMiddleware, canRespond, changeStatusValidator, updateIncidentStatus);
IncidentRouter.post("/create-incident", authMiddleware, canRespond, createIncidentValidator, createIncidentHandler);
IncidentRouter.get("/", authMiddleware, canView, getIncidentsHandler);
IncidentRouter.get("/get-incident/:id", authMiddleware, canView, getIncidentByIdHandler);
IncidentRouter.post("/:id/assign", authMiddleware, canRespond, assignValidator, assignHandler);
IncidentRouter.delete("/:id/assign/:userId", authMiddleware, canRespond, unassignHandler);
IncidentRouter.post("/:id/updates", authMiddleware, canRespond, postNoteValidator, postNoteHandler);

export default IncidentRouter;