import type { Types } from "mongoose";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                organizationId: string;
                role: "admin" | "responder" | "viewer";
            };
        }
    }
}
