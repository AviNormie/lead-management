import { redirect } from "next/navigation";

export default async function ReEngagedLeadDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/leads/${id}`);
}
