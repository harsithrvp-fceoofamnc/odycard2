"use client";
import { useState } from "react";

// Homepage = access-code screen. Starts LOCKED on every load/refresh (in-memory state),
// so the code is required every single time you open odysra.com. On a correct code the
// chatbot is shown inline (same page) — no persistent "remember me".
export default function Home() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4) return;
    setBusy(true);
    setErr(false);
    try {
      const r = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (r.ok) {
        setUnlocked(true);
      } else {
        setErr(true);
        setCode("");
      }
    } catch {
      setErr(true);
    }
    setBusy(false);
  }

  if (unlocked) {
    return (
      <iframe
        src="/ody/index.html"
        allow="microphone"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg,#3e2713,#241509)", color: "#f6ecd8",
      fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif", padding: 20, textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, marginBottom: 16,
        background: "#fff8ec", color: "#3e2713", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 26, boxShadow: "0 0 0 2px #c79233, 0 6px 18px rgba(0,0,0,.35)",
      }}>A</div>
      <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: 1, color: "#e3b956" }}>Odysra</div>
      <div style={{ fontSize: 13, marginTop: 4, marginBottom: 34, color: "#d9c5a3" }}>Sree Annapoorna · AI Waiter</div>

      <form onSubmit={submit} style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 15, marginBottom: 14, color: "#ecdcc0" }}>Enter access code</div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoFocus
          placeholder="••••••"
          style={{
            width: "100%", textAlign: "center", fontSize: 30, letterSpacing: 12,
            padding: "14px 10px", borderRadius: 14,
            border: err ? "2px solid #e76f51" : "2px solid rgba(227,185,86,.4)",
            background: "rgba(255,255,255,.07)", color: "#fff", outline: "none",
          }}
        />
        {err && <div style={{ color: "#f4a261", fontSize: 13, marginTop: 10 }}>Wrong code — try again.</div>}
        <button type="submit" disabled={busy} style={{
          width: "100%", marginTop: 18, padding: 13, borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#e3b956,#c79233)", color: "#3a2a05", fontWeight: 800, fontSize: 15, cursor: "pointer",
          boxShadow: "0 6px 16px rgba(199,146,51,.35)",
          opacity: busy ? 0.6 : 1,
        }}>{busy ? "Checking…" : "Unlock"}</button>
      </form>

      <div style={{ fontSize: 11, opacity: 0.55, marginTop: 28, color: "#d9c5a3" }}>Authorised access only</div>
    </div>
  );
}
