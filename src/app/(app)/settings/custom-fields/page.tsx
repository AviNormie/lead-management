import { requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createCustomFieldAction,
  toggleCustomFieldAction,
} from "@/features/leads/custom-field-actions";

export default async function CustomFieldsSettingsPage() {
  const tenant = await requirePermission("lead.manage_custom_fields");
  const fields = await prisma.leadCustomFieldDefinition.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Custom fields"]}
        title="Custom fields"
        subtitle="Organization-specific profile fields on the lead form and dial/update dialog"
      />
      <Card className="mb-4">
        <CardContent className="pt-5">
          <form action={createCustomFieldAction} className="flex flex-wrap gap-2">
            <Input name="label" placeholder="Field label" required className="max-w-xs" />
            <Input name="key" placeholder="Key (optional)" className="max-w-[140px]" />
            <Select name="type" defaultValue="TEXT" className="max-w-[140px]">
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="SELECT">Select</option>
              <option value="DATE">Date</option>
              <option value="BOOLEAN">Boolean</option>
              <option value="TEXTAREA">Textarea</option>
            </Select>
            <Input name="section" placeholder="Section" defaultValue="profile" className="max-w-[120px]" />
            <Input name="options" placeholder="Options (comma separated)" className="max-w-xs" />
            <Button type="submit" size="sm">Add field</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          {fields.length === 0 ? (
            <p className="text-sm text-muted">No custom fields yet.</p>
          ) : (
            <ul className="grid gap-2">
              {fields.map((field) => (
                <li
                  key={field.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
                >
                  <span>
                    {field.label}{" "}
                    <Badge tone="neutral">{field.key}</Badge>{" "}
                    <Badge tone="neutral">{field.type}</Badge>
                  </span>
                  <form action={toggleCustomFieldAction}>
                    <input type="hidden" name="id" value={field.id} />
                    <Button size="sm" variant="ghost">
                      {field.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
