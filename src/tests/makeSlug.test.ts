import { describe, it, expect } from "vitest";
import { makeSlug } from "../services/makeSlug.ts";

describe("makeSlug", () => {
    it("lowercases and joins words with hyphens", () => {
        expect(makeSlug("Acme Corp")).toBe("acme-corp");
    });

    it("trims spaces around the name", () => {
        expect(makeSlug("  Acme Corp  ")).toBe("acme-corp");
    });

    it("treats several spaces as one separator", () => {
        expect(makeSlug("Acme    Corp")).toBe("acme-corp");
    });

    it("removes characters that are unsafe in a URL", () => {
        expect(makeSlug("Acme!@#Corp")).toBe("acmecorp");
    });

    it("does not leave double hyphens when a symbol sits between words", () => {
        expect(makeSlug("Acme & Co.")).toBe("acme-co");
    });
});