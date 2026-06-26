import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole(["admin"]);
  if (!s) redirect("/login?next=/admin");
  return <>{children}</>;
}
