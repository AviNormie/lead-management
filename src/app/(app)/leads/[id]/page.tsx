import { notFound } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/tenant";
import { getLeadDetail, getLeadLookups } from "@/features/leads/queries";
import { LeadDetailView } from "@/features/leads/lead-detail-view";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requirePermission("lead.view");
  const { id } = await params;
  const [lead, lookups] = await Promise.all([
    getLeadDetail(tenant, id),
    getLeadLookups(tenant.organizationId),
  ]);
  if (!lead) notFound();

  return (
    <LeadDetailView
      lead={JSON.parse(JSON.stringify(lead))}
      lookups={lookups}
      canEdit={hasPermission(tenant, "lead.edit")}
      canAssign={hasPermission(tenant, "lead.assign")}
      canStage={hasPermission(tenant, "lead.change_stage")}
      canConvert={hasPermission(tenant, "lead.convert")}
      canDelete={hasPermission(tenant, "lead.delete")}
    />
  );
}
