import { body } from "express-validator";
import { validate } from "./ValidatorFunction.ts";


export const registerValidator = [
    body("organizationName")
        .trim()
        .notEmpty()
        .withMessage("Organization name is required")
        .isLength({ min: 3, max: 30 })
        .withMessage("Organization name must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9\s&.'-]+$/)
        .withMessage("Organization name can only contain letters, numbers, and underscores"),

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3, max: 30 })
        .withMessage("Name must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9\s&.'-]+$/)
        .withMessage("Name can only contain letters, numbers, and underscores"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    validate,
];

export const loginValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    validate,
];
