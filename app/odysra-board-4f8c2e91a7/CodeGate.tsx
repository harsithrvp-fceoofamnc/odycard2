"use client";
import { useState } from "react";

/** The access-code box. The code itself never reaches this component — it is posted to
 *  /api/fest/feedback-access and compared server-side. */
export default function CodeGate() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/fest/feedback-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        window.location.reload();
        return;
      }
      setErr(j.error || "Wrong code");
      setCode("");
    } catch {
      setErr("Network error. Try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={S.form}>
      <label htmlFor="fbcode" style={S.label}>Access code</label>
      <input
        id="fbcode"
        type="password"
        inputMode="text"
        autoComplete="off"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={S.input}
      />
      {err && <p style={S.err}>{err}</p>}
      <button type="submit" disabled={busy || !code.trim()} style={{ ...S.btn, opacity: busy || !code.trim() ? 0.45 : 1 }}>
        {busy ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}

const S: Record<string, React.CSSProperties> = {
  form: { width: "100%", maxWidth: 300, display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 13, fontWeight: 600, color: "#8f8f95" },
  input: {
    width: "100%", boxSizing: "border-box", background: "#151517", border: "1px solid #2c2c30",
    borderRadius: 12, color: "#f1f1f1", fontSize: 17, padding: "13px 14px", outline: "none",
    letterSpacing: "2px",
  },
  err: { fontSize: 13, color: "#e2857f", margin: 0 },
  btn: {
    background: "#f1f1f1", color: "#0b0b0c", fontWeight: 700, fontSize: 15,
    padding: "13px 22px", borderRadius: 999, border: 0, cursor: "pointer", marginTop: 2,
  },
};
