import { ApiError } from "../services/ApiError.ts";
import type { Request, Response, NextFunction } from "express";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message
        })
    }

    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    })
}