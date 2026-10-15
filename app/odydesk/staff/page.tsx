"use client";

// odysra.com/odydesk/staff — phone preview of the OdyDesk Staff app (lodge guest ID register).
// Static build in public/odydesk/staff runs on fake data only (no real keys, no real guests).
// Sits behind the site login like the other demos.
export default function OdyDeskStaff() {
  return (
    <>
      <style>{`html,body{height:100%;overflow:hidden;overscroll-behavior:none;background:#000}`}</style>
      <iframe
        src="/odydesk/staff/index.html?v=7"
        title="OdyDesk Staff"
        allow="camera"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </>
  );
}
