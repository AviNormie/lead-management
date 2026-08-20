"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        className: "rounded-xl border border-[var(--ic-border)]",
      }}
    />
  );
}
