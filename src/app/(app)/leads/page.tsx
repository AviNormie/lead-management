import { hasPermission, requirePermission } from "@/lib/tenant";
import {
  getLeadDashboardStats,
  getLeadLookups,
  listLeads,
  listLeadsForKanban,
} from "@/features/leads/queries";
import { LeadsWorkspace } from "@/features/leads/leads-workspace";
import { perfTime } from "@/lib/perf";

function stringParams(raw: Record<string, string | string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value) out[key] = value;
  }
  return out;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requirePermission("lead.view");
  const params = await searchParams;
  const view = typeof params.view === "string" ? params.view : "table";
  const canCreate = hasPermission(tenant, "lead.create");
  const canExport = hasPermission(tenant, "lead.export");
  const canImport = hasPermission(tenant, "lead.import");

  const queryTimer = perfTime("leads.list+lookups");
  const [list, kanban, lookups, stats] = await Promise.all([
    view === "kanban" ? null : listLeads(tenant, params),
    view === "kanban" ? listLeadsForKanban(tenant, params) : null,
    getLeadLookups(tenant.organizationId),
    getLeadDashboardStats(tenant.organizationId, tenant.userId),
  ]);
  queryTimer.end();

  const rows = (list?.rows ?? kanban?.rows ?? []).map((lead) => ({
    id: lead.id,
    fullName: lead.fullName,
    email: lead.email,
    company: lead.company,
    status: lead.status,
    priority: lead.priority,
    leadScore: lead.leadScore,
    nextFollowUpAt: lead.nextFollowUpAt,
    source: lead.source,
    stage: lead.stage,
    assignedUser: lead.assignedUser,
  }));

  return (
    <LeadsWorkspace
      rows={rows}
      total={list?.total ?? rows.length}
      page={list?.page ?? 1}
      pageSize={list?.pageSize ?? rows.length}
      params={stringParams(params)}
      lookups={lookups}
      stats={{
        total: stats.total,
        newLeads: stats.newLeads,
        converted: stats.converted,
        followUpsDue: stats.followUpsDue,
      }}
      canCreate={canCreate}
      canExport={canExport}
      canImport={canImport}
      canEdit={hasPermission(tenant, "lead.edit")}
      canAssign={hasPermission(tenant, "lead.assign")}
      canStage={hasPermission(tenant, "lead.change_stage")}
      canDelete={hasPermission(tenant, "lead.delete")}
    />
  );
}
