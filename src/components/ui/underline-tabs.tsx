"use client";

import { cn } from "@/lib/utils";

export function UnderlineTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-1 border-b border-[var(--ic-border)]",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-0.5 pb-3 text-sm transition",
              active
                ? "border-foreground font-semibold text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
