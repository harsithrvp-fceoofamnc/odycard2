import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole(["supervisor"]);
  if (!s) redirect("/login?next=/supervisor");
  return <>{children}</>;
}
