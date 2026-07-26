"use client";
import { useBBSession } from "../_ui";
import { AiManagerPanel } from "./AiManagerPanel";

// Full-screen view of the AI Manager (the same panel that sits on the owner dashboard).
export default function InsightsPage() {
  const { me, ready } = useBBSession(["admin"]);
  if (!ready || !me)
    return (
      <div style={{ background: "#f6f7f9", color: "#811226", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        Checking access…
      </div>
    );
  return (
    <div style={{ minHeight: "100vh", background: "#eef0f3" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f6f7f9", boxShadow: "0 0 40px rgba(20,10,15,.08)", padding: "16px 14px 96px" }}>
        <a href="/bon-bon/admin" style={{ color: "#811226", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>← Back to dashboard</a>
        <div style={{ marginTop: 12 }}>
          <AiManagerPanel />
        </div>
      </div>
    </div>
  );
}
