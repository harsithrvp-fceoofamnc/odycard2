"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, Spinner, PasswordField, useBBSession } from "../_ui";
import { AiManagerPanel } from "../insights/AiManagerPanel";

type Staff = { id: string; name: string; username: string; role: string; active: boolean; tables?: number[] };
type OrderItem = { name: string; qty: number; price: number };
type Order = { id: string; ticket?: number; total: number; status: string; created_at: string; table?: string; items?: OrderItem[] };

export default function AdminPage() {
  const { me, ready } = useBBSession(["admin"]);
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "kitchen" | "staff">("home");
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
        <img className="ownlogo" src="/bon_bon_logo.png" alt="Bon Bon" />
        <div className="owntitle">
          {tab === "home" ? "Owner dashboard" : tab === "kitchen" ? "Kitchen" : "Team & details"}
          <span>{me.name}</span>
        </div>
        <button className="ownout" onClick={logout}>Log out</button>
      </header>
      <main className="ownmain">
      {loading ? (
        <Spinner />
      ) : tab === "kitchen" ? (
        <KitchenTab orders={orders} />
      ) : tab === "home" ? (
        <div className="stagger">
          {/* today, at a glance */}
          <div className="opsgrid">
            <Stat label="Today's sales" value={`₹${revenue}`} accent />
            <Stat label="Today's orders" value={String(todays.length)} />
            <Stat label="Live orders" value={String(activeOrders)} />
            <Stat label="Menu items" value={menuCount == null ? "—" : String(menuCount)} />
          </div>
          <p style={{ fontSize: 11.5, color: "#9aa0aa", margin: "-2px 2px 4px", lineHeight: 1.5 }}>
            Sales are visible to you only — never to supervisors or waiters. Today&apos;s figures come from real orders.
          </p>

          {/* AI Manager — the capsule, right on the owner dashboard */}
          <AiManagerPanel />

          <div className="quick">
            <a href="/bon-bon/manage">Menu</a>
            <a href="/bon-bon/kitchen">Kitchen screen</a>
            <a href="/bon-bon/waiter">Waiter screen</a>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 14 }}>
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

      <nav className="ownnav2">
        <button className={tab === "home" ? "on" : ""} onClick={() => setTab("home")}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
          Home
        </button>
        <button className={tab === "kitchen" ? "on" : ""} onClick={() => setTab("kitchen")}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3h16v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M8 14v7M16 14v7" /></svg>
          Kitchen
        </button>
        <button className={tab === "staff" ? "on" : ""} onClick={() => setTab("staff")}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" /><path d="M17 8.5a3 3 0 0 1 0 5M18 20c0-2-.8-3.6-2-4.6" /></svg>
          Team
        </button>
      </nav>
      </div>
    </div>
  );
}

// ── Kitchen tab — today's tickets, newest first ───────────────────────────────
function KitchenTab({ orders }: { orders: Order[] }) {
  const today = new Date().toDateString();
  const mine = orders
    .filter((o) => new Date(o.created_at).toDateString() === today && o.status !== "cancelled")
    .sort((a, b) => (b.ticket || 0) - (a.ticket || 0));
  const live = mine.filter((o) => ["new", "preparing", "ready"].includes(o.status));
  const done = mine.filter((o) => !["new", "preparing", "ready"].includes(o.status));
  const sales = mine.reduce((s, o) => s + (o.total || 0), 0);
  const ago = (t: string) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 60000));
    return m < 1 ? "just now" : m < 60 ? m + "m ago" : Math.round(m / 60) + "h ago";
  };
  const cls = (s: string) => (s === "ready" ? "ready" : s === "served" || s === "done" ? "served" : "prep");

  return (
    <div className="stagger">
      <div className="opsgrid">
        <Stat label="Orders today" value={String(mine.length)} accent />
        <Stat label="In progress" value={String(live.length)} />
        <Stat label="Completed" value={String(done.length)} />
        <Stat label="Sales" value={`₹${sales}`} />
      </div>
      <div className="sechead">Live tickets</div>
      {live.length === 0 && <div className="empty">Nothing cooking right now.</div>}
      {live.map((o) => (
        <div className="tick" key={o.id}>
          <div className="th">
            <div><b>{o.table ? "Table " + o.table : "Order"}</b> <span className="tno">#{o.ticket || o.id}</span></div>
            <span className="tago">{ago(o.created_at)}</span>
          </div>
          <div className="tit">{(o.items || []).map((i) => `${i.qty}× ${i.name}`).join(" · ") || "—"}</div>
          <div className="tf">
            <span className={"st " + cls(o.status)}>{o.status}</span>
            <span className="tamt">₹{o.total}</span>
          </div>
        </div>
      ))}
      {done.length > 0 && (
        <>
          <div className="sechead">Completed today</div>
          {done.slice(0, 12).map((o) => (
            <div className="tick done" key={o.id}>
              <div className="th">
                <div><b>{o.table ? "Table " + o.table : "Order"}</b> <span className="tno">#{o.ticket || o.id}</span></div>
                <span className="tago">{ago(o.created_at)}</span>
              </div>
              <div className="tit">{(o.items || []).map((i) => `${i.qty}× ${i.name}`).join(" · ") || "—"}</div>
              <div className="tf">
                <span className={"st " + cls(o.status)}>{o.status}</span>
                <span className="tamt">₹{o.total}</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const OWN_CSS = `
.own{min-height:100vh;color:#16131a;font-family:-apple-system,"Segoe UI",Roboto,system-ui,sans-serif;background:#e7e9ee;-webkit-font-smoothing:antialiased}
.own .owncol{max-width:460px;margin:0 auto;min-height:100vh;position:relative;background:#eceef2;box-shadow:0 0 40px rgba(20,10,15,.09)}
.own .ownhdr{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:11px;
  padding:13px 16px;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid #e7e9ec}
.own .ownlogo{width:34px;height:34px;border-radius:9px;object-fit:cover}
.own .owntitle{font-size:15.5px;font-weight:700;letter-spacing:-.01em;color:#16131a;display:flex;flex-direction:column;line-height:1.15}
.own .owntitle span{font-size:11.5px;color:#8a8a90;font-weight:500;margin-top:1px}
.own .ownout{margin-left:auto;padding:7px 13px;border-radius:9px;border:1px solid #e4e4e7;background:#fff;color:#6c7280;font-weight:600;font-size:12.5px;cursor:pointer}
.own .ownmain{padding:15px 15px 108px}

/* entrance animation */
.own .stagger{display:flex;flex-direction:column;gap:13px}
.own .stagger>*{opacity:0;animation:ownin .5s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes ownin{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.own .stagger>*:nth-child(1){animation-delay:.02s}.own .stagger>*:nth-child(2){animation-delay:.07s}
.own .stagger>*:nth-child(3){animation-delay:.12s}.own .stagger>*:nth-child(4){animation-delay:.17s}
.own .stagger>*:nth-child(5){animation-delay:.22s}.own .stagger>*:nth-child(n+6){animation-delay:.27s}

.own .opsgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.own .sechead{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#6c7280;margin:6px 2px -4px}
.own .empty{background:#fff;border-radius:16px;padding:18px;text-align:center;color:#9aa0aa;font-size:13.5px;box-shadow:0 1px 2px rgba(20,20,40,.05)}

/* quick links */
.own .quick{display:flex;gap:8px;flex-wrap:wrap}
.own .quick a{flex:1;text-align:center;background:#fff;border:1px solid #ececf0;border-radius:13px;padding:12px 8px;
  font-size:12.5px;font-weight:600;color:#811226;text-decoration:none;box-shadow:0 1px 2px rgba(20,20,40,.04)}

/* kitchen tickets */
.own .tick{background:#fff;border-radius:16px;padding:15px 16px;box-shadow:0 1px 2px rgba(20,20,40,.05),0 6px 18px rgba(20,20,40,.03)}
.own .tick.done{opacity:.72}
.own .tick .th{display:flex;align-items:center;justify-content:space-between;gap:8px}
.own .tick .th b{font-size:14.5px;font-weight:700}
.own .tick .tno{font-size:12px;color:#9aa0aa}
.own .tick .tago{font-size:11.5px;color:#9aa0aa}
.own .tick .tit{font-size:13.5px;color:#6c7280;margin-top:5px;line-height:1.5}
.own .tick .tf{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.own .tick .tamt{font-size:14px;font-weight:800;color:#811226}
.own .st{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:4px 10px;border-radius:20px}
.own .st.prep{background:#fbf0dd;color:#a86412}
.own .st.ready{background:#e7f0fb;color:#2f6fb0}
.own .st.served{background:#e8f6ef;color:#0e7a55}

/* bottom tab bar */
.own .ownnav2{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:min(460px,100vw);z-index:46;
  display:flex;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border-top:1px solid #e9ebee;
  padding:8px 6px 15px;box-shadow:0 -4px 20px rgba(20,15,25,.06)}
.own .ownnav2 button{flex:1;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;gap:3px;
  color:#9aa0aa;font-family:inherit;font-size:10.5px;font-weight:600;cursor:pointer;padding:4px 0}
.own .ownnav2 button svg{stroke:currentColor}
.own .ownnav2 button.on{color:#811226}
`;


function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? `linear-gradient(135deg,${C.maroon},${C.dark})` : "#fff", border: accent ? "0" : "1px solid #ececf0", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 2px rgba(20,10,15,.04)" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent ? "#fff" : C.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: accent ? "rgba(255,255,255,.85)" : "#8a8a90", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
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
