import { Router } from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import * as c from "../controllers/invitation.controller.ts";

const memberRouter = Router();

memberRouter.get("/", authMiddleware, c.listMembersHandler);

export default memberRouter;