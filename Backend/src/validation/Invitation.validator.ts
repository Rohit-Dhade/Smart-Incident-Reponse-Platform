import { body } from "express-validator";
import { ROLES } from "../types/role.ts";
import { validate } from "./ValidatorFunction.ts";

export const createInvitationValidator = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("role").isIn(ROLES).withMessage("Invalid role"),
    validate,
];

export const acceptInvitationValidator = [
    body("token").isString().trim().isLength({ min: 32, max: 200 }).withMessage("Invalid invitation"),
    body("name").optional().isString().trim().isLength({ min: 2, max: 50 }),
    body("password").isString().notEmpty().withMessage("Password is required"),
    validate,
];