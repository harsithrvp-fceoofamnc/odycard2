"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DetailsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [brand, setBrand] = useState("");
  const [branch, setBranch] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // must be signed in to reach this step
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/auth/me");
      if (!r.ok) {
        router.replace("/signup");
        return;
      }
      const d = await r.json();
      if (d?.user?.branch_id) {
        router.replace("/admin"); // already set up
        return;
      }
      setReady(true);
    })();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_name: brand, branch_name: branch }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "Could not save your details");
        setBusy(false);
        return;
      }
      router.push(data.redirect || "/admin");
    } catch {
      setErr("Network error — please try again");
      setBusy(false);
    }
  }

  if (!ready) return <div style={{ ...wrap, color: "#6b7280" }}>Loading…</div>;

  return (
    <div style={wrap}>
      <form onSubmit={submit} style={card}>
        <div style={{ fontSize: 13, letterSpacing: 1, color: "#c79233", fontWeight: 700 }}>ODYSRA · STEP 2</div>
        <h1 style={{ margin: "6px 0 2px", fontSize: 24, color: "#23262b" }}>Tell us about your hotel</h1>
        <p style={{ margin: "0 0 18px", color: "#6b7280", fontSize: 14 }}>You can add more branches later from your dashboard.</p>

        <label style={lbl}>Restaurant / brand name</label>
        <input style={inp} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Sree Annapoorna" />

        <label style={lbl}>First branch name</label>
        <input style={inp} value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. RS Puram" />

        {err && <div style={errBox}>{err}</div>}

        <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy}>
          {busy ? "Setting up…" : "Go to my dashboard"}
        </button>
      </form>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3efe7", padding: 20, fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" };
const card: React.CSSProperties = { width: 400, maxWidth: "100%", background: "#fff", borderRadius: 18, padding: "30px 28px", boxShadow: "0 18px 50px rgba(0,0,0,.10)", border: "1px solid #ece7dd" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#4b5563", margin: "12px 0 5px" };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: "1.5px solid #e3ddd0", fontSize: 15, outline: "none", color: "#23262b", background: "#fffdf9" };
const btn: React.CSSProperties = { width: "100%", marginTop: 20, padding: "13px", border: 0, borderRadius: 12, background: "linear-gradient(135deg,#5c3a1c,#3e2713)", color: "#f4ecdb", fontSize: 15.5, fontWeight: 700, cursor: "pointer" };
const errBox: React.CSSProperties = { marginTop: 14, background: "#fdecea", border: "1px solid #f5c6cb", color: "#a32d2d", fontSize: 13.5, padding: "9px 12px", borderRadius: 10 };
