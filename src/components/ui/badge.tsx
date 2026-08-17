import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  default: "bg-[var(--ic-surface-muted)] text-muted",
  primary: "bg-primary-soft text-primary",
  success: "bg-emerald-50 text-success",
  warning: "bg-amber-50 text-warning",
  danger: "bg-red-50 text-danger",
  neutral: "bg-slate-100 text-slate-700",
} as const;

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
