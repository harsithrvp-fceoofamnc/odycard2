"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C, font, PasswordField } from "../_ui";

export default function BonBonLogin() {
  const router = useRouter();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // If already signed in, skip straight to the right place.
  useEffect(() => {
    fetch("/api/bonbon/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const s = d.session;
        if (s) router.replace(dest(s.role));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dest(role: string) {
    return role === "admin" ? "/bon-bon/admin" : role === "supervisor" ? "/bon-bon/manage" : "/bon-bon/waiter";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/bonbon/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(d.error || "Could not sign in");
        setBusy(false);
        return;
      }
      router.replace(dest(d.role));
    } catch {
      setErr("Network error — try again");
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(700px 420px at 50% -10%, ${C.maroon}, ${C.dark} 70%)`,
        fontFamily: font,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: C.card,
          borderRadius: 20,
          padding: "30px 26px 26px",
          boxShadow: "0 20px 50px rgba(0,0,0,.28)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bon_bon_logo.png" alt="Bon Bon" style={{ height: 58, objectFit: "contain" }} />
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800, color: C.ink }}>Staff sign in</div>
          <div style={{ fontSize: 12.5, color: C.mut, marginTop: 3 }}>
            Owners, supervisors &amp; waiters
          </div>
        </div>
        <form onSubmit={submit}>
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect="off"
            style={inp}
          />
          <PasswordField value={p} onChange={setP} placeholder="Password" autoComplete="current-password" style={{ ...inp, marginTop: 10 }} />
          {err && <div style={{ color: C.warn, fontSize: 13, marginTop: 10 }}>{err}</div>}
          <button type="submit" disabled={busy} style={{ ...btn, opacity: busy ? 0.7 : 1 }}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a href="/bon-bon" style={{ fontSize: 12.5, color: C.maroon, fontWeight: 600, textDecoration: "none" }}>
            ← Back to the menu
          </a>
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 11,
  border: `1.5px solid ${C.line}`,
  fontSize: 15,
  outline: "none",
  color: C.ink,
  background: "#fff",
};
const btn: React.CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: "12px 16px",
  border: 0,
  borderRadius: 12,
  background: `linear-gradient(135deg,${C.maroon},${C.dark})`,
  color: "#fff",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};
