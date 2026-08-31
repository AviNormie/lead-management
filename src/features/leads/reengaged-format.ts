import { differenceInHours, format } from "date-fns";

export function formatLeadDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "dd-MM-yyyy");
}

export function formatLeadDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "dd-MM-yyyy h:mm a");
}

export function formatShortDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "dd-MM-yy h:mm a");
}

export function dueCallLabel(dueAt: Date | string | null | undefined) {
  if (!dueAt) return "—";
  const date = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const hours = differenceInHours(date, new Date());
  if (hours <= 24) return "24 hrs.";
  if (hours <= 48) return "48 hrs.";
  if (hours <= 72) return "72 hrs.";
  return `${Math.max(hours, 0)} hrs.`;
}

export function shortLeadId(id: string) {
  const digits = id.replace(/\D/g, "").slice(-5);
  if (digits.length >= 4) return `#${digits.padStart(5, "0")}`;
  return `#${id.slice(-5).toUpperCase()}`;
}
