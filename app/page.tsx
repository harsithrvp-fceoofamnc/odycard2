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
      alignItems: "center", justifyContent: "center", background: "#10243f", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif", padding: 20, textAlign: "center",
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1, color: "#e9c46a" }}>Odysra</div>
      <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, marginBottom: 34 }}>Sree Annapoorna · AI Waiter</div>

      <form onSubmit={submit} style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 15, marginBottom: 14 }}>Enter access code</div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoFocus
          placeholder="••••••"
          style={{
            width: "100%", textAlign: "center", fontSize: 30, letterSpacing: 12,
            padding: "14px 10px", borderRadius: 14,
            border: err ? "2px solid #e76f51" : "2px solid rgba(255,255,255,.25)",
            background: "rgba(255,255,255,.08)", color: "#fff", outline: "none",
          }}
        />
        {err && <div style={{ color: "#f4a261", fontSize: 13, marginTop: 10 }}>Wrong code — try again.</div>}
        <button type="submit" disabled={busy} style={{
          width: "100%", marginTop: 18, padding: 13, borderRadius: 12, border: "none",
          background: "#2645A8", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
          opacity: busy ? 0.6 : 1,
        }}>{busy ? "Checking…" : "Unlock"}</button>
      </form>

      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 28 }}>Authorised access only</div>
    </div>
  );
}
