import { requireRole } from "@/lib/auth";
import SupervisorPanel from "./SupervisorPanel";

export default async function SupervisorPage() {
  const s = await requireRole(["supervisor"]);
  return <SupervisorPanel name={s?.name ?? "Supervisor"} />;
}
