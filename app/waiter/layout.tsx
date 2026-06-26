import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function WaiterLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole(["waiter"]);
  if (!s) redirect("/login?next=/waiter");
  return <>{children}</>;
}
