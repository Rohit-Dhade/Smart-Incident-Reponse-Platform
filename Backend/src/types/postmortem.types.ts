export const POSTMORTEM_STATUSES = ["draft", "published"] as const;
export type PostmortemStatus = (typeof POSTMORTEM_STATUSES)[number];