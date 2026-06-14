"use client";
import { use } from "react";

// odysra.com/annapoorna/<outlet>  e.g. /annapoorna/rs-puram
// Opens the chatbot directly into that branch (the bot reads ?outlet=<slug> and auto-selects it).
export default function Outlet({ params }: { params: Promise<{ outlet: string }> }) {
  const { outlet } = use(params);
  const slug = encodeURIComponent(outlet);
  return (
    <iframe
      src={`/ody/index.html?outlet=${slug}`}
      allow="microphone"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
