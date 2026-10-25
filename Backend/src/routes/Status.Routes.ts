import { Router } from "express";
import rateLimit from "express-rate-limit";
import { publicStatusHandler } from "../controllers/Status.controller.ts";

const statusRouter = Router();

const statusLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

statusRouter.get("/:slug", statusLimiter, publicStatusHandler);

export default statusRouter;