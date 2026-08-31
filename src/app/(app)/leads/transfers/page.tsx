import { requirePermission } from "@/lib/tenant";
import { listLeadTransfers } from "@/features/leads/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";

export default async function LeadTransfersPage() {
  const tenant = await requirePermission("lead.view");
  const transfers = await listLeadTransfers(tenant);

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "Transfers"]}
        title="Transfer history"
        subtitle="Leads reassigned between team members"
      />
      <Card>
        <CardContent className="pt-5">
          {transfers.length === 0 ? (
            <p className="text-sm text-muted">No transfers recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {transfers.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2"
                >
                  <div>
                    <Link href={`/leads/${t.lead.id}`} className="font-medium text-primary">
                      {t.lead.fullName}
                    </Link>
                    <p className="text-2xs text-subtle">
                      {t.fromUser?.name ?? t.fromUser?.email ?? "Unassigned"} →{" "}
                      {t.toUser?.name ?? t.toUser?.email ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right text-2xs text-muted">
                    <p>{format(t.createdAt, "dd MMM yyyy HH:mm")}</p>
                    <p>{t.transferredBy.name ?? t.transferredBy.email}</p>
                    {t.reason ? <p>{t.reason}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
