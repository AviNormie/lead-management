import Link from "next/link";
import { format } from "date-fns";
import { Filter, Plus, Upload } from "lucide-react";
import { hasPermission, requirePermission } from "@/lib/tenant";
import { getLeadLookups, listLeads } from "@/features/leads/queries";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/layout/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ExportLeadsButton } from "@/features/leads/export-button";

function toneForStatus(status: string) {
  if (status === "CONVERTED" || status === "QUALIFIED") return "success" as const;
  if (status === "LOST" || status === "UNQUALIFIED") return "danger" as const;
  if (status === "NEW") return "primary" as const;
  return "neutral" as const;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requirePermission("lead.view");
  const params = await searchParams;
  const canCreate = hasPermission(tenant, "lead.create");
  const canExport = hasPermission(tenant, "lead.export");
  const canImport = hasPermission(tenant, "lead.import");

  const [{ rows, total, page, pageSize }, lookups] = await Promise.all([
    listLeads(tenant.organizationId, params),
    getLeadLookups(tenant.organizationId),
  ]);

  const q = typeof params.q === "string" ? params.q : "";

  return (
    <div>
      <PageHeader
        breadcrumbs={["Overview", "Leads"]}
        title="Leads"
        subtitle={format(new Date(), "dd MMM yyyy")}
        actions={
          <>
            {canImport ? (
              <Link href="/leads/import">
                <Button type="button" variant="secondary" size="sm">
                  <Upload className="h-3.5 w-3.5" />
                  Import
                </Button>
              </Link>
            ) : null}
            {canExport ? <ExportLeadsButton /> : null}
            {canCreate ? (
              <Link href="/leads/new">
                <Button type="button" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  New lead
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle>All leads ({total})</CardTitle>
          <form className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            <Input
              name="q"
              defaultValue={q}
              className="max-w-xs rounded-pill bg-[var(--ic-surface-muted)]"
              placeholder="Search leads…"
            />
            <select
              name="status"
              defaultValue={typeof params.status === "string" ? params.status : ""}
              className="h-10 rounded-xl border border-[var(--ic-border)] px-3 text-sm"
            >
              <option value="">All statuses</option>
              {["NEW", "OPEN", "IN_PROGRESS", "QUALIFIED", "CONVERTED", "LOST"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </select>
            <select
              name="stageId"
              defaultValue={typeof params.stageId === "string" ? params.stageId : ""}
              className="h-10 rounded-xl border border-[var(--ic-border)] px-3 text-sm"
            >
              <option value="">All stages</option>
              {lookups.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              "Lead",
              "Company",
              "Source",
              "Stage",
              "Status",
              "Priority",
              "Assigned",
              "Score",
              "Next follow-up",
            ]}
            empty="No leads yet. Create one or import a CSV."
          >
            {rows.length
              ? rows.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[var(--ic-border)] last:border-0"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-primary"
                      >
                        {lead.fullName}
                      </Link>
                      <div className="text-2xs text-subtle">{lead.email}</div>
                    </td>
                    <td className="px-3 py-3 text-muted">{lead.company ?? "—"}</td>
                    <td className="px-3 py-3">{lead.source?.name ?? "—"}</td>
                    <td className="px-3 py-3">{lead.stage?.name ?? "—"}</td>
                    <td className="px-3 py-3">
                      <Badge tone={toneForStatus(lead.status)}>{lead.status}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone="neutral">{lead.priority}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      {lead.assignedUser ? (
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={lead.assignedUser.name} size="sm" />
                          <span className="text-sm">
                            {lead.assignedUser.name ?? lead.assignedUser.email}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3">{lead.leadScore}</td>
                    <td className="px-3 py-3 text-muted">
                      {lead.nextFollowUpAt
                        ? format(lead.nextFollowUpAt, "dd MMM yyyy")
                        : "—"}
                    </td>
                  </tr>
                ))
              : null}
          </DataTable>
          <p className="mt-4 text-2xs text-subtle">
            Page {page} · {pageSize} per page
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
