import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ImportWizard } from "@/features/leads/import-wizard";

export default async function ImportLeadsPage() {
  await requirePermission("lead.import");
  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "Import"]}
        title="Bulk import"
        subtitle="Upload a CSV, map columns, preview, then import into this organization."
      />
      <Card>
        <CardContent className="pt-5">
          <ImportWizard />
        </CardContent>
      </Card>
    </div>
  );
}
