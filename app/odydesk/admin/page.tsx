"use client";

// odysra.com/odydesk/admin — phone preview of the OdyDesk Admin (owner) app.
// Static build in public/odydesk/admin runs on fake data only (no real keys, no real guests).
// Sits behind the site login like the other demos.
import OdyDeskFrame from "@/components/OdyDeskFrame";

export default function OdyDeskAdmin() {
  return <OdyDeskFrame src="/odydesk/admin/index.html?v=12" title="OdyDesk Admin" />;
}
