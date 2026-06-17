"use client";
import { useState, useEffect } from "react";

// Homepage = access-code screen. Starts LOCKED on every load/refresh (in-memory state),
// so the code is required every single time. The screen styles itself for whichever demo
// the visitor came from: clean light "Odysra" for the white-label /restaurant demo,
// warm espresso "Sree Annapoorna" otherwise.
export default function Home() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    const nx = new URLSearchParams(window.location.search).get("next");
    setDemo(!!nx && nx.startsWith("/restaurant"));
  }, []);

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
        const nx = new URLSearchParams(window.location.search).get("next");
        window.location.href = nx && (nx.startsWith("/annapoorna") || nx.startsWith("/restaurant")) ? nx : "/annapoorna";
        return;
      } else {
        setErr(true);
        setCode("");
      }
    } catch {
      setErr(true);
    }
    setBusy(false);
  }

  const dots = (stroke: string, op: string) =>
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='none' stroke='${stroke}' stroke-width='1' stroke-opacity='${op}'%3E%3Ccircle cx='0' cy='0' r='20'/%3E%3Ccircle cx='40' cy='0' r='20'/%3E%3Ccircle cx='0' cy='40' r='20'/%3E%3Ccircle cx='40' cy='40' r='20'/%3E%3Ccircle cx='20' cy='20' r='20'/%3E%3C/g%3E%3C/svg%3E")`;

  const t = demo
    ? {
        bg: `${dots("%231f2430", "0.04")}, linear-gradient(160deg,#ffffff,#eef1f4)`,
        logoBg: "#2b313a", logoFg: "#f4ecdb", ring: "#c79233", logoChar: "O",
        titleColor: "#1f2430", sub: "AI Waiter — Demo", subColor: "#8a909c",
        label: "#5a6172", inputBg: "#ffffff", inputBorder: "rgba(43,49,58,.2)", inputText: "#1f2430",
        btn: "linear-gradient(135deg,#2b313a,#161a20)", btnText: "#ffffff", btnShadow: "0 6px 16px rgba(43,49,58,.25)",
        foot: "#9aa0ab", errText: "#d9622d",
      }
    : {
        bg: `${dots("%23ffffff", "0.05")}, linear-gradient(160deg,#3e2713,#241509)`,
        logoBg: "#fff8ec", logoFg: "#3e2713", ring: "#c79233", logoChar: "A",
        titleColor: "#e3b956", sub: "Sree Annapoorna · AI Waiter", subColor: "#d9c5a3",
        label: "#ecdcc0", inputBg: "rgba(255,255,255,.07)", inputBorder: "rgba(227,185,86,.4)", inputText: "#ffffff",
        btn: "linear-gradient(135deg,#e3b956,#c79233)", btnText: "#3a2a05", btnShadow: "0 6px 16px rgba(199,146,51,.35)",
        foot: "#d9c5a3", errText: "#f4a261",
      };

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: t.bg, backgroundSize: "40px 40px, cover",
      fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif", padding: 20, textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, marginBottom: 16,
        background: t.logoBg, color: t.logoFg, display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 26, boxShadow: `0 0 0 2px ${t.ring}, 0 6px 18px rgba(0,0,0,.30)`,
      }}>{t.logoChar}</div>
      <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: 1, color: t.titleColor }}>Odysra</div>
      <div style={{ fontSize: 13, marginTop: 4, marginBottom: 34, color: t.subColor }}>{t.sub}</div>

      <form onSubmit={submit} style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 15, marginBottom: 14, color: t.label }}>Enter access code</div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoFocus
          placeholder="••••••"
          style={{
            width: "100%", textAlign: "center", fontSize: 30, letterSpacing: 12,
            padding: "14px 10px", borderRadius: 14,
            border: err ? "2px solid #e76f51" : `2px solid ${t.inputBorder}`,
            background: t.inputBg, color: t.inputText, outline: "none",
          }}
        />
        {err && <div style={{ color: t.errText, fontSize: 13, marginTop: 10 }}>Wrong code — try again.</div>}
        <button type="submit" disabled={busy} style={{
          width: "100%", marginTop: 18, padding: 13, borderRadius: 12, border: "none",
          background: t.btn, color: t.btnText, fontWeight: 800, fontSize: 15, cursor: "pointer",
          boxShadow: t.btnShadow, opacity: busy ? 0.6 : 1,
        }}>{busy ? "Checking…" : "Unlock"}</button>
      </form>

      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 28, color: t.foot }}>Authorised access only</div>
    </div>
  );
}
