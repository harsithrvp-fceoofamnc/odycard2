"use client";

// odysra.com/bonbon — the Bon Bon ice-cream chatbot (single outlet, straight to chat).
// Gated by middleware (the access-code cookie).
export default function BonBon() {
  return (
    <>
      <style>{`html,body{height:100%;overflow:hidden;overscroll-behavior:none;background:#000}`}</style>
      <iframe
        src="/bonbon/index.html?v=54"
        allow="microphone"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </>
  );
}
