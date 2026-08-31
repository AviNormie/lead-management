import Link from "next/link";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { DashboardCharts } from "@/features/leads/dashboard-charts";
import { ExportLeadsButton } from "@/features/leads/export-button";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/layout/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Closed (converted)",
  LOST: "Lost",
};

export function LeadsReportsView({
  summary,
  canExport,
}: {
  summary: {
    total: number;
    statusCounts: Record<string, number>;
    interestedCount: number;
    lostCount: number;
    closedCount: number;
    byProduct: { label: string; value: number }[];
    byLostReason?: { label: string; value: number }[];
    byPriority?: { label: string; value: number }[];
    transferCount?: number;
    reengagementCount?: number;
    charts: {
      bySource: { label: string; value: number }[];
      byStage: { label: string; value: number; color?: string | null }[];
      overTime: {
        label: string;
        created: number;
        converted: number;
        conversionRate: number;
      }[];
      byAssignee: { label: string; value: number; pipelineValue: number }[];
    };
  };
  canExport: boolean;
}) {
  const conversionRate =
    summary.total > 0
      ? Math.round((summary.closedCount / summary.total) * 1000) / 10
      : 0;

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "Reports"]}
        title="Lead reports"
        subtitle={format(new Date(), "dd MMM yyyy")}
        actions={
          <>
            {canExport ? <ExportLeadsButton filters={{}} /> : null}
            <Link href="/leads/new">
              <Button type="button" size="sm">
                New lead
              </Button>
            </Link>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KpiCard label="All leads" value={summary.total} />
        <KpiCard label="Interested" value={summary.interestedCount} highlighted />
        <KpiCard label="Closed" value={summary.closedCount} />
        <KpiCard label="Lost" value={summary.lostCount} />
        <KpiCard label="Re-engaged" value={summary.reengagementCount ?? 0} />
        <KpiCard label="Transfers" value={summary.transferCount ?? 0} />
      </section>

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-2">
        <KpiCard label="Conversion rate" value={`${conversionRate}%`} />
      </section>

      <DashboardCharts
        bySource={summary.charts.bySource}
        byStage={summary.charts.byStage}
        overTime={summary.charts.overTime}
        byAssignee={summary.charts.byAssignee}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By status</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.total === 0 ? (
              <p className="text-sm text-muted">No leads yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Object.entries(summary.statusCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <li
                      key={status}
                      className="flex items-center justify-between rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2"
                    >
                      <span>{STATUS_LABELS[status] ?? status}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interested in (by product)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.byProduct.length === 0 ? (
              <p className="text-sm text-muted">
                No product interest recorded yet.{" "}
                <Link href="/settings/lead-products" className="text-primary underline-offset-2 hover:underline">
                  Manage products
                </Link>
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {summary.byProduct
                  .sort((a, b) => b.value - a.value)
                  .map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center justify-between rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2"
                    >
                      <span>{row.label}</span>
                      <span className="font-medium">{row.value}</span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {(summary.byLostReason?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Lost reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {summary.byLostReason!.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2"
                  >
                    <span>{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {(summary.byPriority?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>By priority</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {summary.byPriority!.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2"
                  >
                    <span>{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div>
            <p className="font-medium">Quick views</p>
            <p className="text-sm text-muted">Jump to filtered lead lists</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/leads/view/all-leads">
              <Button variant="secondary" size="sm">All leads</Button>
            </Link>
            <Link href="/leads/view/re-engaged">
              <Button variant="secondary" size="sm">Re-engaged</Button>
            </Link>
            <Link href="/leads/view/confirmed">
              <Button variant="secondary" size="sm">Closed leads</Button>
            </Link>
            <Link href="/leads/view/lost-leads">
              <Button variant="secondary" size="sm">Lost leads</Button>
            </Link>
            <Link href="/leads/transfers">
              <Button variant="secondary" size="sm">Transfers</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {canExport ? (
        <p className="mt-4 flex items-center gap-2 text-2xs text-subtle">
          <Download className="h-3.5 w-3.5" />
          Export includes all active leads (up to 5,000 rows).
        </p>
      ) : null}
    </div>
  );
}
