"use client";

// odysra.com/annapoorna/<outlet>  e.g. /annapoorna/rs-puram
// Renders the chatbot; the bot reads the branch from the page URL (window.parent path) and
// auto-selects it. ?v= is a cache-buster so the latest chatbot always loads.
export default function Outlet() {
  return (
    <>
      {/* Lock the page so only the chatbot scrolls internally — no parent bounce / black gap */}
      <style>{`html,body{height:100%;overflow:hidden;overscroll-behavior:none;background:#0e1116}`}</style>
      <iframe
        src="/ody/index.html?v=14"
        allow="microphone"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </>
  );
}
