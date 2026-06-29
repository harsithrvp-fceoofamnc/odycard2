"use client";

// odysra.com/annapoorna — the Annapoorna chatbot (outlet picker). Gated by middleware (the
// access-code cookie); if you land here without it, middleware sends you to the password page.
export default function Annapoorna() {
  return (
    <>
      {/* Lock the page so only the chatbot scrolls internally — no parent bounce / black gap */}
      <style>{`html,body{height:100%;overflow:hidden;overscroll-behavior:none;background:#0e1116}`}</style>
      <iframe
        src="/ody/index.html?v=60"
        allow="microphone"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </>
  );
}
