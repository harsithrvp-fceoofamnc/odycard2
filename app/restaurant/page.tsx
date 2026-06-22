"use client";

// odysra.com/restaurant — generic Odysra AI Waiter demo (outlet picker). White-label.
export default function Restaurant() {
  return (
    <>
      <style>{`html,body{height:100%;overflow:hidden;overscroll-behavior:none;background:#e9ebee}`}</style>
      <iframe
        src="/restaurant/index.html?v=23"
        allow="microphone"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </>
  );
}
