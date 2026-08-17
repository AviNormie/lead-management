import { requirePermission } from "@/lib/tenant";
import { getLeadLookups } from "@/features/leads/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LeadForm } from "@/features/leads/lead-form";

export default async function NewLeadPage() {
  const tenant = await requirePermission("lead.create");
  const lookups = await getLeadLookups(tenant.organizationId);

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "New"]}
        title="New lead"
        subtitle="Capture a lead for the current organization"
      />
      <Card>
        <CardContent className="pt-5">
          <LeadForm lookups={lookups} />
        </CardContent>
      </Card>
    </div>
  );
}
