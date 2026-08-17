import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PROVIDERS = [
  { name: "Facebook", accent: "bg-[#1877F2]" },
  { name: "Instagram", accent: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { name: "WhatsApp Business", accent: "bg-[#25D366]" },
  { name: "LinkedIn", accent: "bg-[#0A66C2]" },
  { name: "Google", accent: "bg-[#EA4335]" },
  { name: "Pinterest", accent: "bg-[#E60023]" },
  { name: "Website Forms", accent: "bg-primary" },
];

export default async function IntegrationsSettingsPage() {
  await requirePermission("integration.view");

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Integrations"]}
        title="Integrations"
        subtitle="Each organization connects its own accounts. OAuth providers are not live in Phase 1."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PROVIDERS.map((provider) => (
          <Card key={provider.name}>
            <CardContent className="flex items-center justify-between gap-3 pt-5">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl ${provider.accent}`}
                  aria-hidden
                />
                <div>
                  <p className="font-semibold">{provider.name}</p>
                  <Badge tone="warning" className="mt-1">
                    Not connected
                  </Badge>
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" disabled>
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
