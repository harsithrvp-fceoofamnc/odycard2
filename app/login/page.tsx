"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { googleIdToken, googleConfigured } from "@/lib/firebaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function go(redirect?: string) {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next || redirect || "/admin");
  }

  async function withGoogle() {
    setErr("");
    if (!googleConfigured()) {
      setErr("Google sign-in isn't configured yet (missing Firebase keys).");
      return;
    }
    setBusy(true);
    try {
      const idToken = await googleIdToken();
      const r = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "Google sign-in failed");
        setBusy(false);
        return;
      }
      go(data.redirect);
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "";
      setErr(m.includes("popup") ? "Sign-in was cancelled." : "Could not sign in with Google.");
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "Could not log in");
        setBusy(false);
        return;
      }
      go(data.redirect);
    } catch {
      setErr("Network error — please try again");
      setBusy(false);
    }
  }

  return (
    <div style={wrap}>
      <form onSubmit={submit} style={card}>
        <div style={{ fontSize: 13, letterSpacing: 1, color: "#c79233", fontWeight: 700 }}>ODYSRA</div>
        <h1 style={{ margin: "6px 0 2px", fontSize: 24, color: "#23262b" }}>Log in</h1>
        <p style={{ margin: "0 0 18px", color: "#6b7280", fontSize: 14 }}>
          Owners use Google, their mobile or email. Staff use the username their manager gave them.
        </p>

        <button type="button" onClick={withGoogle} disabled={busy} style={googleBtn}>
          <GoogleG />
          <span>Continue with Google</span>
        </button>
        <div style={divider}>
          <span style={dividerLine} />
          <span style={{ color: "#9aa0a8", fontSize: 12.5 }}>or</span>
          <span style={dividerLine} />
        </div>

        <label style={lbl}>Mobile, email or username</label>
        <input style={inp} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="your login" autoCapitalize="none" />

        <label style={lbl}>Password</label>
        <input style={inp} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />

        {err && <div style={errBox}>{err}</div>}

        <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        <div style={{ marginTop: 14, fontSize: 13, color: "#6b7280", textAlign: "center" }}>
          New here?{" "}
          <a href="/signup" style={{ color: "#7a4a24", fontWeight: 600 }}>
            Create an admin account
          </a>
        </div>
      </form>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" />
      <path fill="#FBBC05" d="M10.4 28.3c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C.9 16.1 0 19.9 0 23.7s.9 7.6 2.6 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 47.4c6.2 0 11.4-2 15.2-5.5l-7.1-5.5c-2 1.4-4.6 2.2-8.1 2.2-6.3 0-11.7-3.7-13.6-9l-7.8 6.1C6.5 42 14.6 47.4 24 47.4z" />
    </svg>
  );
}

const wrap: React.CSSProperties = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3efe7", padding: 20, fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" };
const googleBtn: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 12, border: "1.5px solid #dadce0", background: "#fff", color: "#3c4043", fontSize: 15, fontWeight: 600, cursor: "pointer" };
const divider: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, margin: "16px 0" };
const dividerLine: React.CSSProperties = { flex: 1, height: 1, background: "#ece7dd" };
const card: React.CSSProperties = { width: 400, maxWidth: "100%", background: "#fff", borderRadius: 18, padding: "30px 28px", boxShadow: "0 18px 50px rgba(0,0,0,.10)", border: "1px solid #ece7dd" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#4b5563", margin: "12px 0 5px" };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: "1.5px solid #e3ddd0", fontSize: 15, outline: "none", color: "#23262b", background: "#fffdf9" };
const btn: React.CSSProperties = { width: "100%", marginTop: 20, padding: "13px", border: 0, borderRadius: 12, background: "linear-gradient(135deg,#5c3a1c,#3e2713)", color: "#f4ecdb", fontSize: 15.5, fontWeight: 700, cursor: "pointer" };
const errBox: React.CSSProperties = { marginTop: 14, background: "#fdecea", border: "1px solid #f5c6cb", color: "#a32d2d", fontSize: 13.5, padding: "9px 12px", borderRadius: 10 };
