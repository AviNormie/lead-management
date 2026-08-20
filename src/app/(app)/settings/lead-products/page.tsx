import { hasPermission, requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createLeadProductAction,
  toggleLeadProductAction,
  updateLeadProductAction,
} from "@/features/leads/settings-actions";

export default async function SettingsLeadProductsPage() {
  const tenant = await requirePermission("lead.view");
  const canManage = hasPermission(tenant, "lead.manage_products");
  const products = await prisma.leadProduct.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Products"]}
        title="Products"
        subtitle="Active products appear in the Interested in field on the lead form."
      />
      {canManage ? (
        <Card className="mb-4">
          <CardContent className="pt-5">
            <form action={createLeadProductAction} className="flex flex-wrap gap-2">
              <Input name="name" placeholder="Product name" required className="max-w-xs" />
              <Input name="code" placeholder="Code (optional)" className="max-w-[160px]" />
              <Button type="submit" size="sm">
                Add product
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="pt-5">
          {products.length === 0 ? (
            <p className="text-sm text-muted">
              No products yet.{canManage ? " Add one above to populate the lead form." : ""}
            </p>
          ) : (
            <ul className="grid gap-2">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
                >
                  {canManage ? (
                    <form
                      action={updateLeadProductAction}
                      className="flex flex-1 flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="id" value={product.id} />
                      <Input
                        name="name"
                        defaultValue={product.name}
                        className="h-8 max-w-xs"
                      />
                      <Badge tone="neutral">{product.code}</Badge>
                      <Badge tone={product.isActive ? "success" : "neutral"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button size="sm" variant="secondary">
                        Save
                      </Button>
                    </form>
                  ) : (
                    <span className="flex items-center gap-2">
                      {product.name}
                      <Badge tone="neutral">{product.code}</Badge>
                    </span>
                  )}
                  {canManage ? (
                    <form action={toggleLeadProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <Button size="sm" variant="ghost">
                        {product.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
