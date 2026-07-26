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
    <div style={{ minHeight: "100vh", background: "radial-gradient(800px 520px at 50% 0%,#241417,#120a0b 72%)" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", minHeight: "100vh", background: "linear-gradient(180deg,rgba(18,8,6,.72),rgba(18,8,6,.82)),url('/wood_web.jpg') center/cover", boxShadow: "0 0 60px rgba(0,0,0,.55)", padding: "16px 14px 44px" }}>
        <a href="/bon-bon/admin" style={{ color: "#e9cf94", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>← Back to dashboard</a>
        <div style={{ marginTop: 12 }}>
          <AiManagerPanel />
        </div>
      </div>
    </div>
  );
}
