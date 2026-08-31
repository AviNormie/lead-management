import { hasPermission, requirePermission } from "@/lib/tenant";
import { getLeadReportsSummary } from "@/features/leads/queries";
import { LeadsReportsView } from "@/features/leads/leads-reports-view";

export default async function LeadsReportsPage() {
  const tenant = await requirePermission("lead.view");
  const summary = await getLeadReportsSummary(tenant.organizationId);

  return (
    <LeadsReportsView
      summary={summary}
      canExport={hasPermission(tenant, "lead.export")}
    />
  );
}
