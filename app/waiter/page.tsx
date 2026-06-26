import { requireRole } from "@/lib/auth";
import WaiterHome from "./WaiterHome";

export default async function WaiterPage() {
  const s = await requireRole(["waiter"]);
  return <WaiterHome name={s?.name ?? "Waiter"} />;
}
