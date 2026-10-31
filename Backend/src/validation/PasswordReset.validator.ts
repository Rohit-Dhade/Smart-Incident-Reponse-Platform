import { body } from "express-validator";
import { validate } from "./ValidatorFunction.ts";

export const forgotPasswordValidator = [
    body("email").trim().isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    validate,
];

export const resetPasswordValidator = [
    body("token").isString().trim().isLength({ min: 64, max: 64 }).withMessage("Invalid reset link"),
    body("password").isString().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    validate,
];