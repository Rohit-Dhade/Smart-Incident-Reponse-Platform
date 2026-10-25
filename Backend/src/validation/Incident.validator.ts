import { body } from "express-validator";
import { INCIDENT_SEVERITIES } from "../types/incident.types.ts";
import { validate } from "./ValidatorFunction.ts";
import { UPDATE_VISIBILITIES } from "../types/update.types.ts";

export const createIncidentValidator = [
    body("title")
        .trim()
        .notEmpty().withMessage("Title is required")
        .isLength({ max: 120 }).withMessage("Title must be 120 characters or fewer"),
    body("description").optional().isString().trim().isLength({ max: 2000 }),
    body("severity").isIn(INCIDENT_SEVERITIES).withMessage("Invalid severity"),
    body("serviceId").isMongoId().withMessage("Invalid service id"),
    validate,
];

export const assignValidator = [
    body("userId").isMongoId().withMessage("Invalid user id"),
    validate,
];

export const postNoteValidator = [
    body("message")
        .trim()
        .notEmpty().withMessage("Message is required")
        .isLength({ max: 1000 }).withMessage("Message must be 1000 characters or fewer"),
    body("visibility").optional().isIn(UPDATE_VISIBILITIES).withMessage("Invalid visibility"),
    validate,
];