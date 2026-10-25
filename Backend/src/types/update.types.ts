export const UPDATE_TYPES = ["created", "status_change", "assigned", "unassigned", "note"] as const;
export type UpdateType = (typeof UPDATE_TYPES)[number];

export const UPDATE_VISIBILITIES = ["internal", "public"] as const;
export type UpdateVisibility = (typeof UPDATE_VISIBILITIES)[number];