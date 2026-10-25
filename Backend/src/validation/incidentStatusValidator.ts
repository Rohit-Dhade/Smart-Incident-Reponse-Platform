import { validate } from "./ValidatorFunction.ts";
import { body } from "express-validator";
import { INCIDENT_STATUSES } from "../types/incident.types.ts";

export const changeStatusValidator = [
    body("status")
        .isIn(INCIDENT_STATUSES)
        .withMessage("Invalid incident status"),

    body("note")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 }),
    validate,
];