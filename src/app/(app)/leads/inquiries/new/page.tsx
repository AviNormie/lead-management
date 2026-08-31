import { requirePermission } from "@/lib/tenant";
import { getInquiryLookups } from "@/features/inquiries/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { InquiryForm } from "@/features/inquiries/inquiry-form";

export default async function NewInquiryPage() {
  const tenant = await requirePermission("lead.create");
  const lookups = await getInquiryLookups(tenant.organizationId);

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "Inquiries", "New"]}
        title="New inquiry"
        subtitle="Capture an incoming inquiry for the current organization"
      />
      <Card>
        <CardContent className="pt-5">
          <InquiryForm lookups={lookups} />
        </CardContent>
      </Card>
    </div>
  );
}
