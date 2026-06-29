import { redirect } from "next/navigation";

// The real, data-backed supervisor dashboard now lives at /supervisor (Firestore, no demo numbers).
// This legacy mock page just forwards there so no fake values are ever shown.
export default function Page() {
  redirect("/supervisor");
}
