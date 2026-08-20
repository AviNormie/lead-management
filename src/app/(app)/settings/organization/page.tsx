import {
  getCurrentOrganization,
  hasPermission,
} from "@/lib/tenant";
import { OrganizationSettingsForm } from "@/features/organizations/organization-settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OrganizationSettingsPage() {
  const { organization, tenant } = await getCurrentOrganization();
  const canUpdate = hasPermission(tenant, "org.update");

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Organization"]}
        title="Organization"
        subtitle="Profile for the current tenant workspace"
      />
      <Card>
        <CardContent className="pt-5">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{organization.slug}</Badge>
            <Badge tone="neutral">{organization.currency}</Badge>
            <Badge tone="neutral">{organization.timezone}</Badge>
          </div>
          <OrganizationSettingsForm
            organization={organization}
            canUpdate={canUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
