"use client";
import { useCallback, useEffect, useState } from "react";
import { C, Shell, NavLink, Spinner, useBBSession } from "../_ui";

type Staff = { id: string; name: string; username: string; role: string; active: boolean };
type Order = { id: string; total: number; status: string; created_at: string };

export default function AdminPage() {
  const { me, ready } = useBBSession(["admin"]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [menuCount, setMenuCount] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [s, m, o] = await Promise.all([
      fetch("/api/bonbon/staff"),
      fetch("/api/bonbon/menu"),
      fetch("/api/bonbon/orders?status=all"),
    ]);
    if (s.ok) setStaff((await s.json()).staff || []);
    if (m.ok) setMenuCount(((await m.json()).items || []).filter((x: { cat: string }) => x.cat !== "addon").length);
    if (o.ok) setOrders((await o.json()).orders || []);
    setLoading(false);
  }, []);
  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  // create staff
  const [role, setRole] = useState("supervisor");
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const r = await fetch("/api/bonbon/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, name, username: user, password: pass }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Could not create login");
    setName("");
    setUser("");
    setPass("");
    setMsg(`Created ${d.role} "${d.name}" — username: ${d.username}`);
    load();
  }

  async function toggleActive(m: Staff) {
    setStaff((p) => p.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)));
    await fetch(`/api/bonbon/staff/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !m.active }),
    });
  }
  async function removeStaff(m: Staff) {
    if (!confirm(`Delete ${m.name}'s login?`)) return;
    setStaff((p) => p.filter((x) => x.id !== m.id));
    await fetch(`/api/bonbon/staff/${m.id}`, { method: "DELETE" });
  }

  if (!ready || !me) return <Spinner label="Checking access…" />;

  const today = new Date().toDateString();
  const todays = orders.filter((o) => o.status !== "cancelled" && new Date(o.created_at).toDateString() === today);
  const revenue = todays.reduce((s, o) => s + (o.total || 0), 0);
  const activeOrders = orders.filter((o) => ["new", "preparing", "ready"].includes(o.status)).length;
  const supervisors = staff.filter((s) => s.role === "supervisor").length;
  const waiters = staff.filter((s) => s.role === "waiter").length;

  return (
    <Shell
      title="Owner dashboard"
      role={me.role}
      name={me.name}
      nav={
        <>
          <NavLink href="/bon-bon/admin" active>
            Dashboard
          </NavLink>
          <NavLink href="/bon-bon/manage">Menu</NavLink>
          <NavLink href="/bon-bon/kitchen">Kitchen</NavLink>
          <NavLink href="/bon-bon/waiter">Waiter</NavLink>
        </>
      }
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* live stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
            <Stat label="Today's sales" value={`₹${revenue}`} accent />
            <Stat label="Today's orders" value={String(todays.length)} />
            <Stat label="Live orders" value={String(activeOrders)} />
            <Stat label="Menu items" value={menuCount == null ? "—" : String(menuCount)} />
            <Stat label="Staff" value={String(staff.length)} />
          </div>
          <p style={{ fontSize: 12, color: C.mut, marginTop: -10, marginBottom: 22 }}>
            Sales are visible to you (the owner) only — never to supervisors or waiters. Figures come from real orders
            placed through the chatbot.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
            {/* staff list */}
            <section style={card}>
              <h2 style={h2}>Staff &amp; logins</h2>
              <p style={hint}>
                {supervisors} supervisor{supervisors === 1 ? "" : "s"} · {waiters} waiter{waiters === 1 ? "" : "s"}.
                Supervisors manage the menu; waiters pick up ready orders.
              </p>
              {staff.length === 0 && <div style={{ color: C.mut, fontSize: 13.5, padding: "8px 0" }}>No staff yet — create one below.</div>}
              {staff.map((m) => (
                <div key={m.id} style={row}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.ink }}>
                      {m.name} <span style={tag(m.role)}>{m.role}</span>
                      {!m.active && <span style={{ ...tag("off"), background: "#eee", color: "#777" }}>disabled</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: C.mut }}>@{m.username}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleActive(m)} style={miniBtn}>
                      {m.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => removeStaff(m)} style={{ ...miniBtn, color: C.warn, borderColor: "#f2c9c4" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {/* create staff */}
            <section style={card}>
              <h2 style={h2}>Create a login</h2>
              <form onSubmit={addStaff}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button type="button" onClick={() => setRole("supervisor")} style={roleBtn(role === "supervisor")}>
                    Supervisor
                  </button>
                  <button type="button" onClick={() => setRole("waiter")} style={roleBtn(role === "waiter")}>
                    Waiter
                  </button>
                </div>
                <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                <input style={{ ...inp, marginTop: 8 }} value={user} onChange={(e) => setUser(e.target.value)} placeholder="Username (their login)" autoCapitalize="none" />
                <input
                  style={{ ...inp, marginTop: 8 }}
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder={role === "supervisor" ? "Password (8+ characters)" : "Password (4+ characters)"}
                />
                {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg.startsWith("Created") ? C.good : C.warn }}>{msg}</div>}
                <button style={{ ...primaryBtn, marginTop: 12, width: "100%" }} disabled={busy}>
                  {busy ? "Creating…" : "Create login"}
                </button>
              </form>
              <p style={{ ...hint, marginTop: 14 }}>
                Supervisor logins are high-security (stronger password + hashing). Waiter logins are kept simple for the
                floor.
              </p>
            </section>
          </div>
        </>
      )}
    </Shell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? `linear-gradient(135deg,${C.maroon},${C.dark})` : C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent ? "#fff" : C.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: accent ? "rgba(255,255,255,.85)" : C.mut, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "18px 18px 20px" };
const h2: React.CSSProperties = { margin: "0 0 4px", fontSize: 16.5, color: C.ink };
const hint: React.CSSProperties = { margin: "0 0 12px", fontSize: 12.5, color: C.mut, lineHeight: 1.5 };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.line}` };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 14.5, outline: "none", color: C.ink, background: "#fff" };
const primaryBtn: React.CSSProperties = { padding: "11px 16px", border: 0, borderRadius: 11, background: `linear-gradient(135deg,${C.maroon},${C.dark})`, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer" };
const miniBtn: React.CSSProperties = { padding: "6px 11px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 700, fontSize: 12.5, cursor: "pointer" };
const tag = (role: string): React.CSSProperties => ({
  fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, padding: "2px 7px", borderRadius: 8, marginLeft: 6,
  background: role === "supervisor" ? "#f7e3e8" : role === "waiter" ? "#eaf3de" : "#eee",
  color: role === "supervisor" ? C.maroon : role === "waiter" ? "#3b6d11" : "#777",
});
const roleBtn = (on: boolean): React.CSSProperties => ({ flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid ${on ? C.maroon : C.line}`, background: on ? C.maroon : "#fff", color: on ? "#fff" : C.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer" });
