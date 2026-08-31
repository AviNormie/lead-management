import { redirect } from "next/navigation";

export default function InterestedLeadsRedirect() {
  redirect("/leads/view/all-leads");
}
