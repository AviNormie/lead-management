export const CALL_OUTCOMES = [
  "Interested",
  "Not Interested",
  "No Answer",
  "Call Back",
  "Qualified",
  "Converted",
  "Wrong Number",
  "Other",
] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number];
