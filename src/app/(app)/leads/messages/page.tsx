import { ModulePlaceholder } from "@/components/leads/module-placeholder";
import { PageHeader } from "@/components/layout/page-header";

export default function LeadMessagesPage() {
  return (
    <div>
      <PageHeader breadcrumbs={["Leads", "Messages"]} title="Messages" />
      <ModulePlaceholder
        title="Communication center"
        description="WhatsApp and SMS threads will appear here once integrations are connected (Phase D)."
      />
    </div>
  );
}
