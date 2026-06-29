import { redirect } from "next/navigation";

// The real, data-backed admin dashboard now lives at /admin (Firestore, no demo numbers).
// This legacy mock page just forwards there so no fake values are ever shown.
export default function Page() {
  redirect("/admin");
}
