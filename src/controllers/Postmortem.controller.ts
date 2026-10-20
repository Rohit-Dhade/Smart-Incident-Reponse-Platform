import type { Request, Response } from "express";
import {
    generatePostmortemDraft,
    getPostmortem,
    updatePostmortem,
    publishPostmortem,
} from "../services/Postmortem.ts";

const scopeOf = (req: Request) => ({
    incidentId: req.params.id as string,
    organizationId: req.user!.organizationId,
});

export async function draftHandler(req: Request, res: Response) {
    const data = await generatePostmortemDraft(scopeOf(req), req.user!.id);
    return res.status(200).json({ success: true, data });
}

export async function getHandler(req: Request, res: Response) {
    const data = await getPostmortem(scopeOf(req));
    return res.status(200).json({ success: true, data });
}

export async function editHandler(req: Request, res: Response) {
    const { summary, impact, rootCause, resolution, actionItems } = req.body;
    const fields = Object.fromEntries(
        Object.entries({ summary, impact, rootCause, resolution, actionItems }).filter(
            ([, v]) => v !== undefined
        )
    );
    const data = await updatePostmortem(scopeOf(req), fields);
    return res.status(200).json({ success: true, data });
}

export async function publishHandler(req: Request, res: Response) {
    const data = await publishPostmortem(scopeOf(req), req.user!.id);
    return res.status(200).json({ success: true, data });
}