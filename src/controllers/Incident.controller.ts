import type { Request, Response } from "express";
import { createIncident } from "../services/CreateIncident.ts";
import { getIncidents, getIncidentById } from "../services/GetIncidents.ts";
import { assignResponder, unassignResponder } from "../services/IncidentAssignment.ts";
import { postIncidentNote } from "../services/PostIncidentNote.ts";
import { emitToOrg } from "../realtime/socket.ts";
import { changeIncidentStatus } from "../services/ChangeIncidentStatus.ts";
import { broadcastPublicStatus } from "../realtime/socket.ts";

export async function createIncidentHandler(req: Request, res: Response) {
    const incident = await createIncident({
        title: req.body.title,
        description: req.body.description,
        severity: req.body.severity,
        serviceId: req.body.serviceId,
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
    });

    emitToOrg(req.user!.organizationId, "incident:created", incident);
    broadcastPublicStatus(req.user!.organizationId);

    return res.status(201).json({ success: true, data: incident });
}

export async function updateIncidentStatus(req: Request, res: Response) {
    const incident = await changeIncidentStatus({
        incidentId: req.params.id as string,
        newStatus: req.body.status,
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        note: req.body.note,
    });

    emitToOrg(req.user!.organizationId, "incident:updated", incident);
    broadcastPublicStatus(req.user!.organizationId);

    return res.status(200).json({ success: true, data: incident });
}

export async function getIncidentsHandler(req: Request, res: Response) {
    const incidents = await getIncidents(req.user!.organizationId as string);
    return res.status(200).json({ success: true, data: incidents });
}

export async function getIncidentByIdHandler(req: Request, res: Response) {
    const incident = await getIncidentById(req.params.id as string, req.user!.organizationId as string);
    return res.status(200).json({ success: true, data: incident });
}

export async function assignHandler(req: Request, res: Response) {
    const incident = await assignResponder({
        incidentId: req.params.id as string,
        assigneeId: req.body.userId,
        organizationId: req.user!.organizationId,
        actorId: req.user!.id,
    });

    emitToOrg(req.user!.organizationId, "incident:updated", incident);

    return res.status(200).json({ success: true, data: incident });
}

export async function unassignHandler(req: Request, res: Response) {
    const incident = await unassignResponder({
        incidentId: req.params.id as string,
        assigneeId: req.params.userId as string,
        organizationId: req.user!.organizationId,
        actorId: req.user!.id,
    });

    emitToOrg(req.user!.organizationId, "incident:updated", incident);

    return res.status(200).json({ success: true, data: incident });
}

export async function postNoteHandler(req: Request, res: Response) {
    const update = await postIncidentNote({
        incidentId: req.params.id as string,
        message: req.body.message,
        visibility: req.body.visibility,
        organizationId: req.user!.organizationId,
        authorId: req.user!.id,
    });

    emitToOrg(req.user!.organizationId, "incident:updated", update);
    if (update.visibility === "public") {
        broadcastPublicStatus(req.user!.organizationId);
    }

    return res.status(201).json({ success: true, data: update });
}