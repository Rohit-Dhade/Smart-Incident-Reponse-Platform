import { Router } from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import { register } from "../controllers/register.ts";
import { registerValidator } from "../validation/AuthValidators.ts";
import { login } from "../controllers/login.ts";
import { loginValidator } from "../validation/AuthValidators.ts";
import { logout, me } from "../controllers/session.ts";

const router = Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.get("/me", authMiddleware, me);
router.post("/logout", logout);

export default router;