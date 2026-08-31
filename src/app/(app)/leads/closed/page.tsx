import { redirect } from "next/navigation";

export default function ClosedLeadsRedirect() {
  redirect("/leads/view/confirmed");
}
