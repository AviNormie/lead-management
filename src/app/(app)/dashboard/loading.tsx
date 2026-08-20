export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-16 animate-pulse rounded-2xl bg-[var(--ic-surface-muted)]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[112px] animate-pulse rounded-card bg-[var(--ic-surface-muted)]"
          />
        ))}
      </div>
      <div className="h-[240px] animate-pulse rounded-2xl bg-[var(--ic-surface-muted)]" />
    </div>
  );
}
