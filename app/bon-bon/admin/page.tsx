"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, Spinner, PasswordField, useBBSession } from "../_ui";
import { AiManagerPanel } from "../insights/AiManagerPanel";

type Staff = { id: string; name: string; username: string; role: string; active: boolean; tables?: number[] };
type Order = { id: string; total: number; status: string; created_at: string };

export default function AdminPage() {
  const { me, ready } = useBBSession(["admin"]);
  const router = useRouter();
  async function logout() {
    await fetch("/api/bonbon/auth/logout", { method: "POST" });
    router.replace("/bon-bon/login");
  }
  const [staff, setStaff] = useState<Staff[]>([]);
  const [menuCount, setMenuCount] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  // freshly reset passwords, shown once so the owner can hand them over (never stored in plaintext)
  const [newPwd, setNewPwd] = useState<Record<string, string>>({});

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
  const [newTables, setNewTables] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // per-waiter inline table-assignment edits (keyed by staff id)
  const [tblEdit, setTblEdit] = useState<Record<string, string>>({});

  // [1,2,3,4,5,8] -> "1-5, 8" for compact display / editing
  function fmtTables(arr?: number[]): string {
    if (!arr || !arr.length) return "";
    const s = [...arr].sort((a, b) => a - b);
    const out: string[] = [];
    let a = s[0];
    let p = s[0];
    for (let i = 1; i <= s.length; i++) {
      if (i < s.length && s[i] === p + 1) {
        p = s[i];
        continue;
      }
      out.push(a === p ? `${a}` : `${a}-${p}`);
      if (i < s.length) {
        a = s[i];
        p = s[i];
      }
    }
    return out.join(", ");
  }
  async function saveTables(m: Staff) {
    const val = tblEdit[m.id] ?? fmtTables(m.tables);
    const r = await fetch(`/api/bonbon/staff/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tables: val }),
    });
    if (r.ok) {
      setTblEdit((p) => {
        const n = { ...p };
        delete n[m.id];
        return n;
      });
      load();
    } else alert((await r.json()).error || "Could not save tables");
  }

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const r = await fetch("/api/bonbon/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, name, username: user, password: pass, tables: role === "waiter" ? newTables : undefined }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Could not create login");
    setName("");
    setUser("");
    setPass("");
    setNewTables("");
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
  // Existing passwords are bcrypt-hashed and can never be read back, so we reset to a new one
  // and reveal it once here for the owner to pass on.
  async function resetPwd(m: Staff) {
    if (!confirm(`Reset ${m.name}'s password?\n\nTheir current password stops working immediately.`)) return;
    setMsg("");
    const r = await fetch(`/api/bonbon/staff/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || "Could not reset password");
      return;
    }
    setNewPwd((p) => ({ ...p, [m.id]: d.password as string }));
  }

  if (!ready || !me) return <Spinner label="Checking access…" />;

  const today = new Date().toDateString();
  const todays = orders.filter((o) => o.status !== "cancelled" && new Date(o.created_at).toDateString() === today);
  const revenue = todays.reduce((s, o) => s + (o.total || 0), 0);
  const activeOrders = orders.filter((o) => ["new", "preparing", "ready"].includes(o.status)).length;
  const supervisors = staff.filter((s) => s.role === "supervisor").length;
  const waiters = staff.filter((s) => s.role === "waiter").length;

  return (
    <div className="own">
      <style>{OWN_CSS}</style>
      <div className="owncol">
      <header className="ownhdr">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ownlogo" src="/logo_web.png" alt="Bon Bon" />
        <div className="owntitle">Owner dashboard<span>{me.name}</span></div>
        <nav className="ownnav">
          <a className="on" href="/bon-bon/admin">Dashboard</a>
          <a href="/bon-bon/manage">Menu</a>
          <a href="/bon-bon/kitchen">Kitchen</a>
          <a href="/bon-bon/waiter">Waiter</a>
        </nav>
        <button className="ownout" onClick={logout}>Log out</button>
      </header>
      <main className="ownmain">
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
          <p style={{ fontSize: 12, color: "#c9b3ad", marginTop: -10, marginBottom: 22 }}>
            Sales are visible to you (the owner) only — never to supervisors or waiters. Today&apos;s figures come from
            real orders placed through the chatbot.
          </p>

          {/* AI Manager — the capsule, right on the owner dashboard */}
          <AiManagerPanel />

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
                <div key={m.id}>
                  <div style={row}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: C.ink }}>
                        {m.name} <span style={tag(m.role)}>{m.role}</span>
                        {!m.active && <span style={{ ...tag("off"), background: "#eee", color: "#777" }}>disabled</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.mut }}>@{m.username}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button onClick={() => resetPwd(m)} style={miniBtn}>
                        Reset password
                      </button>
                      <button onClick={() => toggleActive(m)} style={miniBtn}>
                        {m.active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => removeStaff(m)} style={{ ...miniBtn, color: C.warn, borderColor: "#f2c9c4" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {m.role === "waiter" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "-2px 0 12px" }}>
                      <span style={{ fontSize: 12.5, color: C.mut, fontWeight: 600 }}>Tables:</span>
                      <input
                        value={tblEdit[m.id] ?? fmtTables(m.tables)}
                        onChange={(e) => setTblEdit((p) => ({ ...p, [m.id]: e.target.value }))}
                        placeholder="e.g. 1-5, 8"
                        inputMode="numeric"
                        style={{ ...inp, flex: "1 1 120px", minWidth: 100, padding: "6px 10px", fontSize: 13.5, marginTop: 0 }}
                      />
                      <button onClick={() => saveTables(m)} style={miniBtn}>
                        Save
                      </button>
                      {!(tblEdit[m.id] ?? fmtTables(m.tables)) && <span style={{ fontSize: 11.5, color: C.warn }}>none assigned</span>}
                    </div>
                  )}
                  {newPwd[m.id] && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        margin: "-2px 0 12px",
                        padding: "10px 12px",
                        background: "#fff8e8",
                        border: "1px solid #eedcb0",
                        borderRadius: 10,
                      }}
                    >
                      <span style={{ fontSize: 12.5, color: C.mut }}>New password for @{m.username}:</span>
                      <code style={{ fontSize: 15, fontWeight: 800, color: C.ink, letterSpacing: 1 }}>{newPwd[m.id]}</code>
                      <button onClick={() => navigator.clipboard?.writeText(newPwd[m.id])} style={miniBtn}>
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          setNewPwd((p) => {
                            const n = { ...p };
                            delete n[m.id];
                            return n;
                          })
                        }
                        style={miniBtn}
                      >
                        Hide
                      </button>
                      <span style={{ fontSize: 11.5, color: C.mut, width: "100%" }}>
                        Shown once — copy it now. It&apos;s stored hashed, so it can&apos;t be shown again.
                      </span>
                    </div>
                  )}
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
                  <button type="button" onClick={() => setRole("kitchen")} style={roleBtn(role === "kitchen")}>
                    Kitchen
                  </button>
                  <button type="button" onClick={() => setRole("waiter")} style={roleBtn(role === "waiter")}>
                    Waiter
                  </button>
                </div>
                <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                <input style={{ ...inp, marginTop: 8 }} value={user} onChange={(e) => setUser(e.target.value)} placeholder="Username (their login)" autoCapitalize="none" />
                <PasswordField
                  value={pass}
                  onChange={setPass}
                  autoComplete="new-password"
                  placeholder={role === "supervisor" ? "Password (8+ characters)" : "Password (4+ characters)"}
                  style={{ ...inp, marginTop: 8 }}
                />
                {role === "waiter" && (
                  <input
                    style={{ ...inp, marginTop: 8 }}
                    value={newTables}
                    onChange={(e) => setNewTables(e.target.value)}
                    placeholder="Tables for this waiter (e.g. 1-5, 8)"
                    inputMode="numeric"
                  />
                )}
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
      </main>
      </div>
    </div>
  );
}

const OWN_CSS = `
.own{min-height:100vh;color:#f6ece9;font-family:-apple-system,Segoe UI,Roboto,system-ui,sans-serif;background:#000}
.own .owncol{max-width:460px;margin:0 auto;min-height:100vh;position:relative;
  background:linear-gradient(180deg,rgba(18,8,6,.72),rgba(18,8,6,.82)),url('/wood_web.jpg') center/cover;
  box-shadow:0 0 44px rgba(0,0,0,.5)}
.own .ownhdr{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:11px 15px;background:rgba(20,10,12,.9);backdrop-filter:blur(8px);border-bottom:1px solid rgba(233,207,148,.18)}
.own .ownlogo{width:44px;filter:drop-shadow(0 0 8px rgba(255,255,255,.4)) drop-shadow(0 2px 6px rgba(0,0,0,.5))}
.own .owntitle{font-size:15px;font-weight:800;display:flex;flex-direction:column;line-height:1.15}
.own .owntitle span{font-size:11px;color:#c9b3ad;font-weight:500}
.own .ownnav{display:flex;gap:6px;flex-wrap:wrap;margin-left:8px}
.own .ownnav a{font-size:12.5px;font-weight:700;color:#e9cf94;text-decoration:none;padding:6px 12px;border-radius:9px;border:1px solid rgba(233,207,148,.25)}
.own .ownnav a.on{background:#8f2740;color:#fff;border-color:#8f2740}
.own .ownout{margin-left:auto;padding:7px 13px;border-radius:9px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#f6ece9;font-weight:700;font-size:12.5px;cursor:pointer}
.own .ownmain{padding:16px 14px 60px}
`;


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
  background: role === "supervisor" ? "#f7e3e8" : role === "waiter" ? "#eaf3de" : role === "kitchen" ? "#fdeccf" : "#eee",
  color: role === "supervisor" ? C.maroon : role === "waiter" ? "#3b6d11" : role === "kitchen" ? "#9a6b00" : "#777",
});
const roleBtn = (on: boolean): React.CSSProperties => ({ flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid ${on ? C.maroon : C.line}`, background: on ? C.maroon : "#fff", color: on ? "#fff" : C.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer" });
