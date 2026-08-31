import { LeadsListPage } from "@/features/leads/leads-list-page";

export default async function LeadViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  return <LeadsListPage searchParams={searchParams} viewSlug={slug} />;
}
