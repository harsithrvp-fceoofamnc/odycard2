"use client";

// odysra.com/odydesk/admin — phone preview of the OdyDesk Admin (owner) app.
// Static build in public/odydesk/admin runs on fake data only (no real keys, no real guests).
// Sits behind the site login like the other demos.
export default function OdyDeskAdmin() {
  return (
    <>
      <style>{`html,body{height:100%;overflow:hidden;overscroll-behavior:none;background:#000}`}</style>
      <iframe
        src="/odydesk/admin/index.html?v=8"
        title="OdyDesk Admin"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </>
  );
}
