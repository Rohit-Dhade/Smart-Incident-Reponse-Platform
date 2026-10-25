import type { IncidentStatus } from "../types/incident.types.ts";

/**
 * Incident state machine rules
 *
 * Normal flow: investigating -> identified -> monitoring -> resolved
 * - Forward skips are allowed (a quick fix can go straight to resolved)
 * - Backward moves are allowed (e.g. monitoring -> investigating if it recurs)
 * - A resolved incident can only be reopened, and it reopens to "investigating"
 * - Moving to the same status is not allowed (not listed in the map)
 */
const ALLOWED_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
    investigating: ["identified", "monitoring", "resolved"],
    identified: ["investigating", "monitoring", "resolved"],
    monitoring: ["investigating", "identified", "resolved"],
    resolved: ["investigating"],
};

export function canTransition(from: IncidentStatus, to: IncidentStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
}
