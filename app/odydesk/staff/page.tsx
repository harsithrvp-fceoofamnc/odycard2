"use client";

// odysra.com/odydesk/staff — phone preview of the OdyDesk Staff app (lodge guest ID register).
// Static build in public/odydesk/staff runs on fake data only (no real keys, no real guests).
// Sits behind the site login like the other demos.
import OdyDeskFrame from "@/components/OdyDeskFrame";

export default function OdyDeskStaff() {
  return <OdyDeskFrame src="/odydesk/staff/index.html?v=16" title="OdyDesk Staff" allow="camera" />;
}
