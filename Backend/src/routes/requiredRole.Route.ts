import { Router } from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import { requireRole } from "../middleware/requireRole.ts";

const requiredRoleRouter = Router();

requiredRoleRouter.get("/test-admin", authMiddleware, requireRole(["admin"]), (req, res) => {
    res.json({ message: "You are an admin" });
});

export default requiredRoleRouter;