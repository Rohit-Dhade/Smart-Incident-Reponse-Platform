export function makeSlug(organizationName: string): string {
    return organizationName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-") 
        .replace(/^-|-$/g, "");
}