
import type { Request, Response } from "express";
import { getPublicStatus } from "../services/PublicStatus.ts";

export async function publicStatusHandler(req: Request, res: Response) {
    const data = await getPublicStatus(req.params.slug as string);
    res.set("Cache-Control", "public, max-age=15");
    return res.status(200).json({ success: true, data });
}