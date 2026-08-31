"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import {
  RecordsTable,
  RecordsTableCell,
  RecordsTableRow,
} from "@/components/ui/records-table";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";

export type InquiryListRow = {
  id: string;
  subject: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  status: string;
  priority: string;
  source: string | null;
  createdAt: string;
  assignedUser: { id: string; name: string | null; email: string } | null;
  linkedLead: { id: string; fullName: string } | null;
};

function inquiryStatusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function priorityLabel(priority: string) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function InquiriesListView({
  rows,
  total,
  q,
  status,
}: {
  rows: InquiryListRow[];
  total: number;
  q?: string;
  status?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const columns = useMemo(
    () => [
      { key: "subject", label: "Subject" },
      { key: "contact", label: "Contact" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "assigned", label: "Assigned" },
      { key: "source", label: "Source" },
      { key: "created", label: "Created" },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "Inquiries"]}
        title="New Inquiry"
        subtitle="Track incoming inquiries separately from leads"
        actions={
          <Link
            href="/leads/inquiries/new"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New inquiry
          </Link>
        }
      />

      <div className="ic-card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form
            className="flex flex-wrap items-center gap-2"
            action="/leads/inquiries"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search inquiries"
                className="h-9 w-52 rounded-lg bg-[var(--ic-surface-muted)] pl-9"
              />
            </div>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="h-9 rounded-lg border border-[var(--ic-border)] bg-[var(--ic-surface-muted)] px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <Button type="submit" variant="secondary" size="sm" className="rounded-lg">
              Filter
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-lg"
              disabled={pending}
              onClick={() => startTransition(() => router.refresh())}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
              Refresh
            </Button>
          </form>
          <p className="text-sm text-muted">{total} inquiry{total === 1 ? "" : "ies"}</p>
        </div>

        <RecordsTable
          columns={columns}
          empty="No inquiries yet. Create one to get started."
        >
          {rows.map((row) => (
            <RecordsTableRow
              key={row.id}
              className="cursor-pointer hover:bg-[var(--ic-surface-muted)]/60"
              onClick={() => router.push(`/leads/inquiries/${row.id}`)}
            >
              <RecordsTableCell>
                <Link
                  href={`/leads/inquiries/${row.id}`}
                  className="font-medium text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.subject}
                </Link>
              </RecordsTableCell>
              <RecordsTableCell>
                <div>
                  <p className="font-medium">{row.contactName}</p>
                  {row.email ? (
                    <p className="text-2xs text-subtle">{row.email}</p>
                  ) : row.phone ? (
                    <p className="text-2xs text-subtle">{row.phone}</p>
                  ) : null}
                </div>
              </RecordsTableCell>
              <RecordsTableCell>
                <StatusChip
                  status={row.status}
                  label={inquiryStatusLabel(row.status)}
                />
              </RecordsTableCell>
              <RecordsTableCell>
                <span className="text-sm text-muted">{priorityLabel(row.priority)}</span>
              </RecordsTableCell>
              <RecordsTableCell>
                {row.assignedUser?.name ??
                  row.assignedUser?.email ??
                  "Unassigned"}
              </RecordsTableCell>
              <RecordsTableCell>{row.source ?? "—"}</RecordsTableCell>
              <RecordsTableCell>
                {format(new Date(row.createdAt), "dd MMM yyyy")}
              </RecordsTableCell>
            </RecordsTableRow>
          ))}
        </RecordsTable>
      </div>
    </div>
  );
}
