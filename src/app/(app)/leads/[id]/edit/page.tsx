import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { leadVisibilityWhere } from "@/features/leads/scope";
import { getLeadLookups } from "@/features/leads/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LeadForm } from "@/features/leads/lead-form";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requirePermission("lead.edit");
  const { id } = await params;
  const [lead, lookups] = await Promise.all([
    prisma.lead.findFirst({
      where: { id, ...leadVisibilityWhere(tenant) },
      include: {
        tags: { include: { tag: true } },
        product: true,
      },
    }),
    getLeadLookups(tenant.organizationId),
  ]);
  if (!lead) notFound();

  const products =
    lead.product && !lookups.products.some((p) => p.id === lead.product!.id)
      ? [...lookups.products, { id: lead.product.id, name: lead.product.name }]
      : lookups.products;

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", lead.fullName, "Edit"]}
        title={`Edit ${lead.fullName}`}
      />
      <Card>
        <CardContent className="pt-5">
          <LeadForm
            lookups={{ ...lookups, products }}
            lead={lead}
            tagNames={lead.tags.map((row) => row.tag.name).join(", ")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
