"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Staff = { id: number; name: string; username: string; role: string; active: boolean };

export default function SupervisorPanel({ name }: { name: string }) {
  const router = useRouter();
  const [waiters, setWaiters] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch("/api/staff");
    if (r.ok) setWaiters((await r.json()).staff || []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const [wName, setWName] = useState("");
  const [wUser, setWUser] = useState("");
  const [wPass, setWPass] = useState("");
  const [msg, setMsg] = useState("");
  async function addWaiter(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "waiter", name: wName, username: wUser, password: wPass }),
    });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error || "Could not create waiter");
    setWName("");
    setWUser("");
    setWPass("");
    setMsg(`Created waiter “${d.name}” (username: ${d.username})`);
    load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={page}>
      <div style={topbar}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 1, color: "#c79233", fontWeight: 700 }}>ODYSRA · SUPERVISOR</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#23262b" }}>{name}</div>
        </div>
        <button onClick={logout} style={ghostBtn}>
          Log out
        </button>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: 22 }}>
        <section style={cardBox}>
          <h2 style={h2}>Your waiters</h2>
          <p style={hint}>Create logins for your floor staff. They sign in with the username and password you give them.</p>
          {loading ? (
            <div style={empty}>Loading…</div>
          ) : waiters.length === 0 ? (
            <div style={empty}>No waiters yet.</div>
          ) : (
            waiters.map((w) => (
              <div key={w.id} style={row}>
                <div style={{ fontWeight: 700, color: "#23262b" }}>{w.name}</div>
                <div style={{ fontSize: 12.5, color: "#8a8f98" }}>@{w.username}</div>
              </div>
            ))
          )}
          <form onSubmit={addWaiter} style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#4b5563", marginBottom: 6 }}>Add a waiter</div>
            <input style={inp} value={wName} onChange={(e) => setWName(e.target.value)} placeholder="Full name" />
            <input style={{ ...inp, marginTop: 8 }} value={wUser} onChange={(e) => setWUser(e.target.value)} placeholder="Username" autoCapitalize="none" />
            <input style={{ ...inp, marginTop: 8 }} type="password" value={wPass} onChange={(e) => setWPass(e.target.value)} placeholder="Password (4+ chars)" />
            {msg && <div style={msg.startsWith("Created") ? okLine : errLine}>{msg}</div>}
            <button style={primaryBtn}>Create waiter</button>
          </form>
        </section>
        <p style={{ fontSize: 12.5, color: "#9aa0a8", marginTop: 14, textAlign: "center" }}>
          Sales &amp; revenue are admin-only — they&apos;re never shown here.
        </p>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#f3efe7", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" };
const topbar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: "#fff", borderBottom: "1px solid #ece7dd" };
const cardBox: React.CSSProperties = { background: "#fff", border: "1px solid #ece7dd", borderRadius: 16, padding: "20px 20px 22px" };
const h2: React.CSSProperties = { margin: "0 0 4px", fontSize: 17, color: "#23262b" };
const hint: React.CSSProperties = { margin: "0 0 14px", fontSize: 13, color: "#6b7280", lineHeight: 1.5 };
const row: React.CSSProperties = { padding: "10px 0", borderTop: "1px solid #f1ece2" };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e3ddd0", fontSize: 14.5, outline: "none", color: "#23262b", background: "#fffdf9" };
const primaryBtn: React.CSSProperties = { marginTop: 12, padding: "11px 16px", border: 0, borderRadius: 11, background: "linear-gradient(135deg,#5c3a1c,#3e2713)", color: "#f4ecdb", fontSize: 14.5, fontWeight: 700, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { padding: "8px 14px", borderRadius: 10, border: "1.5px solid #d9d3c7", background: "#fff", color: "#5c3a1c", fontWeight: 700, fontSize: 13.5, cursor: "pointer" };
const empty: React.CSSProperties = { color: "#9aa0a8", fontSize: 13.5, padding: "6px 0" };
const errLine: React.CSSProperties = { marginTop: 10, color: "#a32d2d", fontSize: 13 };
const okLine: React.CSSProperties = { marginTop: 10, color: "#3b6d11", fontSize: 13 };
