"use client";

// odysra.com/restaurant/<outlet> — generic demo chatbot; reads the branch from the URL.
export default function RestaurantOutlet() {
  return (
    <>
      <style>{`html,body{height:100%;overflow:hidden;overscroll-behavior:none;background:#e9ebee}`}</style>
      <iframe
        src="/restaurant/index.html?v=39"
        allow="microphone"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </>
  );
}
