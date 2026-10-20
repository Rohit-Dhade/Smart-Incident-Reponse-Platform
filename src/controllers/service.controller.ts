
import type { Request, Response } from "express";
import { createService, listServices } from "../services/ServiceCrud.ts";
import { broadcastPublicStatus } from "../realtime/socket.ts";

export async function createServiceHandler(req: Request, res: Response) {
    const service = await createService(req.body.name, req.user!.organizationId);

    broadcastPublicStatus(req.user!.organizationId);

    return res.status(201).json({ success: true, data: service });
}

export async function listServicesHandler(req: Request, res: Response) {
    const services = await listServices(req.user!.organizationId);
    return res.status(200).json({ success: true, data: services });
}