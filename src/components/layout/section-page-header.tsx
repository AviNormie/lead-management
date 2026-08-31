import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function PrivateAccessBadge({ className }: { className?: string }) {
  return (
    <Badge
      tone="danger"
      className={cn(
        "rounded-full bg-[#ffe4e8] px-2.5 py-1 text-[11px] font-medium text-[#e11d48]",
        className,
      )}
    >
      <Lock className="h-3 w-3" />
      Private Access
    </Badge>
  );
}

export function SectionPageHeader({
  title,
  subtitle,
  badge,
  meta,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {subtitle ? (
          <p className="text-sm text-muted">{subtitle}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {badge}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        {meta ? (
          <p className="text-xs text-muted">{meta}</p>
        ) : null}
      </div>
    </div>
  );
}
