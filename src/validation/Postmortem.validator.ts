import { body } from "express-validator";
import { validate } from "./ValidatorFunction.ts";

export const editPostmortemValidator = [
    body("summary").optional().isString().trim().isLength({ max: 2000 }),
    body("impact").optional().isString().trim().isLength({ max: 2000 }),
    body("rootCause").optional().isString().trim().isLength({ max: 2000 }),
    body("resolution").optional().isString().trim().isLength({ max: 2000 }),
    body("actionItems").optional().isArray({ max: 20 }),
    body("actionItems.*").isString().trim().notEmpty().isLength({ max: 300 }),
    validate,
];