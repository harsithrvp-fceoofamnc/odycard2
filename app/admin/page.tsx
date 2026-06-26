import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const s = await requireRole(["admin"]);
  // brand-new accounts haven't set up a branch yet → finish sign-up first
  if (s && !s.bid) redirect("/signup/details");
  return <AdminDashboard brandName={s?.name ?? "Your brand"} />;
}
