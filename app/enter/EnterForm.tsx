"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * The site sign-in form.
 *
 * The credentials are posted to /api/site-auth/login and checked there; nothing is
 * compared in the browser, so there is no value in this bundle worth reading.
 *
 * ?next= carries whatever URL the visitor originally asked for, so a deep link like
 * /bon-bon/admin sends them to sign in and then straight on to that page. The value
 * is re-sanitised on this side as well as in the middleware — a link is the easiest
 * thing in the world to hand-edit.
 */
export default function EnterForm() {
  const params = useSearchParams();
  const raw = params?.get("next") ?? null;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/enter") ? raw : "/hub";

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !user.trim() || !pass) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/site-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        window.location.href = next;
        return;
      }
      setErr(j.error || "Wrong username or password");
      setPass("");
    } catch {
      setErr("Network error. Try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={S.form}>
      <label style={S.label} htmlFor="u">Username</label>
      <input
        id="u" name="username" autoComplete="username" autoCapitalize="none"
        autoCorrect="off" spellCheck={false} autoFocus
        value={user} onChange={(e) => setUser(e.target.value)} style={S.input}
      />

      <label style={S.label} htmlFor="p">Password</label>
      <input
        id="p" name="password" type="password" autoComplete="current-password"
        value={pass} onChange={(e) => setPass(e.target.value)} style={S.input}
      />

      {err && <p style={S.err} role="alert">{err}</p>}

      <button type="submit" disabled={busy || !user.trim() || !pass}
        style={{ ...S.btn, opacity: busy || !user.trim() || !pass ? 0.45 : 1 }}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

const S: Record<string, React.CSSProperties> = {
  form: { width: "100%", maxWidth: 330, display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#8e8e96", marginTop: 8 },
  input: {
    width: "100%", boxSizing: "border-box", background: "#151517", border: "1px solid #2c2c30",
    borderRadius: 12, color: "#f1f1f1", fontSize: 16, padding: "13px 14px", outline: "none",
  },
  err: { fontSize: 13, color: "#e2857f", margin: "10px 0 0" },
  btn: {
    marginTop: 18, background: "#f1f1f1", color: "#0b0b0c", fontWeight: 700, fontSize: 15,
    padding: "13px 22px", borderRadius: 999, border: 0, cursor: "pointer",
  },
};
