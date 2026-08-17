import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataTable({
  columns,
  children,
  empty,
  className,
}: {
  columns: string[];
  children?: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--ic-border)] text-2xs uppercase tracking-wide text-subtle">
            {columns.map((column) => (
              <th key={column} className="px-3 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children ?? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center text-sm text-muted"
              >
                {empty ?? "No records yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
