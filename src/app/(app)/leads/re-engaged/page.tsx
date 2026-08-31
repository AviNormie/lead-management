import { format } from "date-fns";
import { requirePermission } from "@/lib/tenant";
import { listReEngagedLeads } from "@/features/leads/queries";
import { ReEngagedListView } from "@/features/leads/reengaged-list-view";

export default async function ReEngagedLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requirePermission("lead.view");
  const raw = await searchParams;
  const { rows, total, parsed } = await listReEngagedLeads(tenant, raw);

  return (
    <ReEngagedListView
      rows={JSON.parse(JSON.stringify(rows))}
      total={total}
      q={parsed.q}
      lastUpdated={format(new Date(), "h.mm a dd MMM yyyy")}
    />
  );
}
