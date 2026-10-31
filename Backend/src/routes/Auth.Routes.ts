import { Router } from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import { register } from "../controllers/register.ts";
import { registerValidator } from "../validation/AuthValidators.ts";
import { login } from "../controllers/login.ts";
import { loginValidator } from "../validation/AuthValidators.ts";
import { logoutHandler } from "../controllers/session.controller.ts";
import { meHandler } from "../controllers/session.controller.ts";
import rateLimit from "express-rate-limit";
import { forgotPasswordHandler, resetPasswordHandler } from "../controllers/PasswordReset.controller.ts";
import { forgotPasswordValidator, resetPasswordValidator } from "../validation/PasswordReset.validator.ts";

const router = Router();

const limiterBase = {
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
};

const forgotIpLimiter = rateLimit({ ...limiterBase, windowMs: 15 * 60 * 1000, limit: 10 });
const forgotEmailLimiter = rateLimit({
    ...limiterBase,
    windowMs: 60 * 60 * 1000,
    limit: 3,
    keyGenerator: (req) => String(req.body?.email ?? ""),
});
const resetLimiter = rateLimit({ ...limiterBase, windowMs: 15 * 60 * 1000, limit: 10 });

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.get("/me", authMiddleware, meHandler);
router.post("/logout", logoutHandler);
router.post("/forgot-password", forgotIpLimiter, forgotPasswordValidator, forgotEmailLimiter, forgotPasswordHandler);
router.post("/reset-password", resetLimiter, resetPasswordValidator, resetPasswordHandler);

export default router;