import { body } from "express-validator";
import { validate } from "./ValidatorFunction.ts";

export const createServiceValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Service name is required")
        .isLength({ max: 60 }).withMessage("Service name must be 60 characters or fewer"),
    validate,
];