import { format } from "date-fns";
import { Download } from "lucide-react";
import { requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { getLeadDashboardStats } from "@/features/leads/queries";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/layout/kpi-card";
import { PerformanceChartCard } from "@/components/layout/performance-chart-card";
import { PerformanceGaugeCard } from "@/components/layout/performance-gauge-card";
import { DataTable } from "@/components/layout/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const tenant = await requirePermission("dashboard.view");
  const [organization, memberCount, stats, recentLeads] = await Promise.all([
    prisma.organization.findUnique({ where: { id: tenant.organizationId } }),
    prisma.organizationMember.count({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    }),
    getLeadDashboardStats(tenant.organizationId, tenant.userId),
    prisma.lead.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      include: { source: true, assignedUser: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: tenant.userId } });
  const today = format(new Date(), "dd MMM yyyy");

  const kpis = [
    { label: "Total leads", value: stats.total, highlighted: false },
    { label: "New leads", value: stats.newLeads, highlighted: true },
    { label: "Assigned to me", value: stats.assignedToMe },
    { label: "Contacted", value: stats.contacted },
    { label: "Qualified", value: stats.qualified },
    { label: "Follow-ups due", value: stats.followUpsDue },
    { label: "Overdue follow-ups", value: stats.overdueFollowUps },
    { label: "Converted", value: stats.converted },
    { label: "Lost leads", value: stats.lost },
    {
      label: "Pipeline value",
      value: `${organization?.currency ?? "USD"} ${stats.pipelineValue}`,
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Overview", "Lead Management"]}
        title="Lead Management"
        subtitle={`${today} · ${organization?.name ?? "Organization"} · ${memberCount} members · Conversion ${stats.conversionRate}%`}
        actions={
          <Link href="/leads">
            <Button type="button" variant="secondary" size="sm">
              <Download className="h-3.5 w-3.5" />
              Open leads
            </Button>
          </Link>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            highlighted={kpi.highlighted}
            delta={stats.total === 0 ? "No lead data yet" : undefined}
            deltaTone="neutral"
          />
        ))}
      </section>

      <section className="mb-6">
        <PerformanceChartCard
          emptyMessage={
            stats.total === 0
              ? "Performance trends will appear when lead activity is available."
              : "Time-series charts use backend aggregations. Add more lead history to see a trend."
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lead Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Name", "Source", "Assigned", "Value", "Date"]}
              empty="No leads yet."
            >
              {recentLeads.length
                ? recentLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-[var(--ic-border)] last:border-0"
                    >
                      <td className="px-3 py-3">
                        <Link href={`/leads/${lead.id}`} className="font-medium">
                          {lead.fullName}
                        </Link>
                      </td>
                      <td className="px-3 py-3">{lead.source?.name ?? "—"}</td>
                      <td className="px-3 py-3">
                        {lead.assignedUser?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        {lead.expectedValue?.toString() ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {format(lead.createdAt, "dd MMM yyyy")}
                      </td>
                    </tr>
                  ))
                : null}
            </DataTable>
          </CardContent>
        </Card>
        <PerformanceGaugeCard
          name={user?.name}
          pendingLabel="Pending follow-ups"
          pendingValue={String(stats.followUpsDue)}
          lostLabel="Lost leads"
          lostValue={String(stats.lost)}
        />
      </section>
    </div>
  );
}
