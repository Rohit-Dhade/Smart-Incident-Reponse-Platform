import { Router } from "express";
import { register } from "../controllers/register.ts";
import { registerValidator } from "../validation/AuthValidators.ts";
import { login } from "../controllers/login.ts";
import { loginValidator } from "../validation/AuthValidators.ts";

const router = Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login)

export default router;