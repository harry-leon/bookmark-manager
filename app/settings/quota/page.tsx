import { redirect } from "next/navigation";

export default function SettingsQuotaRedirect() {
  redirect("/settings?tab=quota");
}
