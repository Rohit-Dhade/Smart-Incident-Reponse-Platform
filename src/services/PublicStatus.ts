import { OrganizationModel } from "../models/Organization.Model.ts";
import { ServiceModel } from "../models/Service.Model.ts";
import { IncidentModel } from "../models/Incident.Model.ts";
import { IncidentUpdateModel } from "../models/IncidentUpdate.Model.ts";
import { ApiError } from "./ApiError.ts";

const RECENT_DAYS = 7;

export async function getPublicStatus(slug: string) {
    const organization = await OrganizationModel.findOne({ slug: slug.toLowerCase() })
        .select("name slug")
        .lean();

    if (!organization) {
        throw new ApiError(404, "Status page not found");
    }

    const organizationId = organization._id;
    const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

    const [services, candidates] = await Promise.all([
        ServiceModel.find({ organizationId })
            .select("name currentStatus")
            .sort({ name: 1 })
            .lean(),

        IncidentModel.find({
            organizationId,
            $or: [{ status: { $ne: "resolved" } }, { resolvedAt: { $gte: since } }],
        })
            .select("title severity status serviceId createdAt resolvedAt")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(),
    ]);

    const publicUpdates = await IncidentUpdateModel.find({
        organizationId,
        incidentId: { $in: candidates.map((i) => i._id) },
        visibility: "public",
    })
        .select("incidentId message createdAt")
        .sort({ createdAt: 1 })
        .lean();

    const updatesByIncident = new Map<string, { message: string; at: Date }[]>();
    for (const u of publicUpdates) {
        const key = String(u.incidentId);
        const list = updatesByIncident.get(key) ?? [];
        list.push({ message: u.message, at: u.createdAt });
        updatesByIncident.set(key, list);
    }

    const serviceNames = new Map(services.map((s) => [String(s._id), s.name]));

    const incidents = candidates
        .filter((i) => updatesByIncident.has(String(i._id)))
        .map((i) => ({
            id: String(i._id),
            title: i.title,
            severity: i.severity,
            status: i.status,
            service: serviceNames.get(String(i.serviceId)) ?? null,
            startedAt: i.createdAt,
            resolvedAt: i.resolvedAt ?? null,
            updates: updatesByIncident.get(String(i._id))!,
        }));

    const overall = services.some((s) => s.currentStatus === "down")
        ? "major_outage"
        : services.some((s) => s.currentStatus === "degraded")
            ? "partial_degradation"
            : "operational";

    return {
        organization: { name: organization.name, slug: organization.slug },
        overall,
        services: services.map((s) => ({ name: s.name, status: s.currentStatus })),
        incidents,
    };
}