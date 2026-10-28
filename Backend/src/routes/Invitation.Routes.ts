import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import { requireRole } from "../middleware/requireRole.ts";
import * as c from "../controllers/invitation.controller.ts";
import { createInvitationValidator, acceptInvitationValidator } from "../validation/Invitation.validator.ts";

const invitationRouter = Router();

const acceptLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
invitationRouter.post("/accept", acceptLimiter, acceptInvitationValidator, c.acceptInvitationHandler);

const adminOnly = requireRole(["admin"]);
invitationRouter.post("/", authMiddleware, adminOnly, createInvitationValidator, c.inviteHandler);
invitationRouter.get("/", authMiddleware, adminOnly, c.listInvitationsHandler);
invitationRouter.delete("/:id", authMiddleware, adminOnly, c.revokeInvitationHandler);

export default invitationRouter;