import { redirect } from "next/navigation";

export default function LostLeadsRedirect() {
  redirect("/leads/view/lost-leads");
}
