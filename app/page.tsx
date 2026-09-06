import { redirect } from "next/navigation";

// odysra.com → the hub.
//
// This used to BE the front door: a 333221 access-code screen that posted to /api/gate.
// Sign-in now happens at /enter, enforced in the middleware before any route resolves, so
// by the time this file runs the visitor is already signed in and there is nothing to ask
// them. The homepage's only job is to hand them to the hub.
export default function Home() {
  redirect("/hub");
}
