import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-sky-50 text-sky-700",
  OPEN: "bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
  QUALIFIED: "bg-emerald-50 text-emerald-700",
  UNQUALIFIED: "bg-rose-50 text-rose-700",
  CONVERTED: "bg-blue-50 text-blue-700",
  LOST: "bg-slate-100 text-slate-600",
  Interested: "bg-emerald-50 text-emerald-700",
  Confirmed: "bg-blue-50 text-blue-700",
  "Not-Interested": "bg-rose-50 text-rose-700",
  Potential: "bg-amber-50 text-amber-700",
};

export function leadStatusLabel(status: string) {
  switch (status) {
    case "QUALIFIED":
      return "Interested";
    case "CONVERTED":
      return "Confirmed";
    case "UNQUALIFIED":
      return "Not-Interested";
    case "OPEN":
    case "IN_PROGRESS":
    case "NEW":
      return "Potential";
    case "LOST":
      return "Lost";
    default:
      return status;
  }
}

export function StatusChip({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const text = label ?? leadStatusLabel(status);
  const style = STATUS_STYLES[text] ?? STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        style,
        className,
      )}
    >
      {text}
    </span>
  );
}
