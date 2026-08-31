import { ModulePlaceholder } from "@/components/leads/module-placeholder";
import { PageHeader } from "@/components/layout/page-header";

export default function LeadEmailPage() {
  return (
    <div>
      <PageHeader breadcrumbs={["Leads", "E-mail"]} title="E-mail" />
      <ModulePlaceholder
        title="Email history"
        description="Lead email threads will sync here when email integration is enabled (Phase D)."
      />
    </div>
  );
}
