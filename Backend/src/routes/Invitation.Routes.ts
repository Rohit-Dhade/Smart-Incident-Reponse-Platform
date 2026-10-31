import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import { requireRole } from "../middleware/requireRole.ts";
import * as c from "../controllers/invitation.controller.ts";
import { createInvitationValidator, acceptInvitationValidator } from "../validation/Invitation.validator.ts";

const invitationRouter = Router();
const acceptLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const adminOnly = requireRole(["admin"]);

const inviteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? "anonymous",
});

invitationRouter.post("/accept", acceptLimiter, acceptInvitationValidator, c.acceptInvitationHandler);
invitationRouter.post("/", authMiddleware, adminOnly, inviteLimiter, createInvitationValidator, c.inviteHandler);
invitationRouter.post("/:id/resend", authMiddleware, adminOnly, inviteLimiter, c.resendHandler);
invitationRouter.get("/", authMiddleware, adminOnly, c.listInvitationsHandler);
invitationRouter.delete("/:id", authMiddleware, adminOnly, c.revokeInvitationHandler);

export default invitationRouter;