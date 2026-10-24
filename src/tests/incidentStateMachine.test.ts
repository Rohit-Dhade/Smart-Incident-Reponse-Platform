import { describe, it, expect } from "vitest";
import { canTransition } from "../services/IncidentStateMachines.ts";
import { INCIDENT_STATUSES, type IncidentStatus } from "../types/incident.types.ts";

describe("incident state machine", () => {
    describe("allowed moves", () => {
        const allowed: [IncidentStatus, IncidentStatus][] = [
            ["investigating", "identified"],
            ["identified", "monitoring"],
            ["monitoring", "resolved"],
            ["investigating", "resolved"], 
            ["monitoring", "investigating"],
            ["resolved", "investigating"], 
        ];

        it.each(allowed)("allows %s -> %s", (from, to) => {
            expect(canTransition(from, to)).toBe(true);
        });
    });

    describe("forbidden moves", () => {
        const forbidden: [IncidentStatus, IncidentStatus][] = [
            ["resolved", "identified"],
            ["resolved", "monitoring"],
        ];

        it.each(forbidden)("blocks %s -> %s", (from, to) => {
            expect(canTransition(from, to)).toBe(false);
        });
    });

    it("never lets a status move to itself", () => {
        for (const status of INCIDENT_STATUSES) {
            expect(canTransition(status, status)).toBe(false);
        }
    });

    it("lets a resolved incident be reopened only to investigating", () => {
        for (const to of INCIDENT_STATUSES) {
            expect(canTransition("resolved", to)).toBe(to === "investigating");
        }
    });

    it("has no dead ends: every status has at least one way out", () => {
        for (const from of INCIDENT_STATUSES) {
            const exits = INCIDENT_STATUSES.filter((to) => canTransition(from, to));
            expect(exits.length).toBeGreaterThan(0);
        }
    });
});