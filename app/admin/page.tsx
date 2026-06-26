import { requireRole } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const s = await requireRole(["admin"]);
  // layout already guards, but keep types happy
  return <AdminDashboard brandName={s?.name ?? "Your brand"} />;
}
