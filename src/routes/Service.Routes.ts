import { Router } from "express";
import { createServiceHandler, listServicesHandler } from "../controllers/service.controller.ts";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import { requireRole } from "../middleware/requireRole.ts";
import { createServiceValidator } from "../validation/Service.validator.ts";
import type { Role } from "../types/role.ts";

const ServiceRouter = Router();

ServiceRouter.post("/create-service", authMiddleware, requireRole(["admin"] as Role[]), createServiceValidator, createServiceHandler);
ServiceRouter.get("/list-services", authMiddleware, listServicesHandler);

export default ServiceRouter;   