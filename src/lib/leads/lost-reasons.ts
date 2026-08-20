export const LOST_REASONS = [
  "Not interested",
  "Budget",
  "Competitor",
  "No response",
  "Wrong lead",
  "Other",
] as const;

export type LostReason = (typeof LOST_REASONS)[number];
