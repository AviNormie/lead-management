import { redirect } from "next/navigation";

export default function PipelinesRedirect() {
  redirect("/settings/pipelines");
}
