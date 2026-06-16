"use client";

// odysra.com/annapoorna — the Annapoorna chatbot (outlet picker). Gated by middleware (the
// access-code cookie); if you land here without it, middleware sends you to the password page.
export default function Annapoorna() {
  return (
    <iframe
      src="/ody/index.html?v=10"
      allow="microphone"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
