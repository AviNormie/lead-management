import { LeadsListPage } from "@/features/leads/leads-list-page";

export default function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <LeadsListPage
      searchParams={searchParams}
      title="Leads"
      breadcrumbs={["Overview", "Leads"]}
      listTitle="All leads"
      basePath="/leads"
    />
  );
}
