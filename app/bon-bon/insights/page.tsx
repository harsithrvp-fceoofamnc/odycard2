"use client";
import { useBBSession } from "../_ui";
import { AiManagerPanel } from "./AiManagerPanel";

// Full-screen view of the AI Manager (the same panel that sits on the owner dashboard).
export default function InsightsPage() {
  const { me, ready } = useBBSession(["admin"]);
  if (!ready || !me)
    return (
      <div style={{ background: "#140c0d", color: "#e9cf94", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        Checking access…
      </div>
    );
  return (
    <div style={{ minHeight: "100vh", background: "#140c0d", padding: "16px 12px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto 10px" }}>
        <a href="/bon-bon/admin" style={{ color: "#e9cf94", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>← Back to dashboard</a>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <AiManagerPanel />
      </div>
    </div>
  );
}
