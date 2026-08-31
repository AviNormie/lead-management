import { requirePermission } from "@/lib/tenant";
import { listInquiries } from "@/features/inquiries/queries";
import { InquiriesListView } from "@/features/inquiries/inquiries-list-view";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requirePermission("lead.view");
  const raw = await searchParams;
  const { rows, total, parsed } = await listInquiries(tenant, raw);

  return (
    <InquiriesListView
      rows={JSON.parse(JSON.stringify(rows))}
      total={total}
      q={parsed.q}
      status={parsed.status}
    />
  );
}
