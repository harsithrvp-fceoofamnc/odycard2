"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Branch = { id: number; name: string; slug: string; address: string | null };
type Staff = { id: number; name: string; username: string; role: string; branch_id: number | null; active: boolean };

export default function AdminDashboard({ brandName }: { brandName: string }) {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [b, s] = await Promise.all([fetch("/api/branches"), fetch("/api/staff")]);
    if (b.ok) setBranches((await b.json()).branches || []);
    if (s.ok) setStaff((await s.json()).staff || []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // create branch
  const [bName, setBName] = useState("");
  const [bAddr, setBAddr] = useState("");
  const [bMsg, setBMsg] = useState("");
  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    setBMsg("");
    const r = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: bName, address: bAddr }),
    });
    const d = await r.json();
    if (!r.ok) return setBMsg(d.error || "Could not add branch");
    setBName("");
    setBAddr("");
    load();
  }

  // create staff
  const [sRole, setSRole] = useState("supervisor");
  const [sName, setSName] = useState("");
  const [sUser, setSUser] = useState("");
  const [sPass, setSPass] = useState("");
  const [sBranch, setSBranch] = useState("");
  const [sMsg, setSMsg] = useState("");
  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setSMsg("");
    const r = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: sRole, name: sName, username: sUser, password: sPass, branch_id: sBranch }),
    });
    const d = await r.json();
    if (!r.ok) return setSMsg(d.error || "Could not create login");
    setSName("");
    setSUser("");
    setSPass("");
    setSMsg(`Created ${sRole} “${d.name}” (username: ${d.username})`);
    load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const branchName = (id: number | null) => branches.find((b) => b.id === id)?.name ?? "—";

  return (
    <div style={page}>
      <div style={topbar}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 1, color: "#c79233", fontWeight: 700 }}>ODYSRA · ADMIN</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#23262b" }}>{brandName}</div>
        </div>
        <button onClick={logout} style={ghostBtn}>
          Log out
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#6b7280", padding: 30 }}>Loading…</div>
      ) : (
        <div style={grid}>
          {/* Branches */}
          <section style={cardBox}>
            <h2 style={h2}>Branches</h2>
            <p style={hint}>
              Each branch gets its own chatbot, kitchen display and waiter app. With more than one branch, an outlet-picker
              page appears in front automatically.
            </p>
            {branches.length === 0 && <div style={empty}>No branches yet.</div>}
            {branches.map((b) => (
              <div key={b.id} style={row}>
                <div>
                  <div style={{ fontWeight: 700, color: "#23262b" }}>{b.name}</div>
                  <div style={{ fontSize: 12.5, color: "#8a8f98" }}>{b.address || "no address set"}</div>
                  <code style={code}>{`<iframe src="https://YOUR-DOMAIN/r/${b.slug}" style="width:100%;height:100%;border:0"></iframe>`}</code>
                </div>
              </div>
            ))}
            <form onSubmit={addBranch} style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "#4b5563", marginBottom: 6 }}>Add a branch</div>
              <input style={inp} value={bName} onChange={(e) => setBName(e.target.value)} placeholder="Branch name (e.g. Gandhipuram)" />
              <input style={{ ...inp, marginTop: 8 }} value={bAddr} onChange={(e) => setBAddr(e.target.value)} placeholder="Address (optional)" />
              {bMsg && <div style={errLine}>{bMsg}</div>}
              <button style={primaryBtn}>Add branch</button>
            </form>
          </section>

          {/* Staff */}
          <section style={cardBox}>
            <h2 style={h2}>Staff &amp; logins</h2>
            <p style={hint}>
              Create supervisor logins (one per branch, high-security). Supervisors then create their own waiters — or you can
              add waiters here too.
            </p>
            {staff.length === 0 && <div style={empty}>No staff yet.</div>}
            {staff.map((m) => (
              <div key={m.id} style={row}>
                <div>
                  <div style={{ fontWeight: 700, color: "#23262b" }}>
                    {m.name} <span style={tag(m.role)}>{m.role}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#8a8f98" }}>
                    @{m.username} · {branchName(m.branch_id)}
                  </div>
                </div>
              </div>
            ))}
            <form onSubmit={addStaff} style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "#4b5563", marginBottom: 6 }}>Create a login</div>
              <div style={{ display: "flex", gap: 8 }}>
                <select style={{ ...inp, flex: 1 }} value={sRole} onChange={(e) => setSRole(e.target.value)}>
                  <option value="supervisor">Supervisor</option>
                  <option value="waiter">Waiter</option>
                </select>
                <select style={{ ...inp, flex: 1 }} value={sBranch} onChange={(e) => setSBranch(e.target.value)}>
                  <option value="">Choose branch…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <input style={{ ...inp, marginTop: 8 }} value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Full name" />
              <input style={{ ...inp, marginTop: 8 }} value={sUser} onChange={(e) => setSUser(e.target.value)} placeholder="Username (their login)" autoCapitalize="none" />
              <input style={{ ...inp, marginTop: 8 }} type="password" value={sPass} onChange={(e) => setSPass(e.target.value)} placeholder={sRole === "supervisor" ? "Password (8+ chars)" : "Password (4+ chars)"} />
              {sMsg && <div style={sMsg.startsWith("Created") ? okLine : errLine}>{sMsg}</div>}
              <button style={primaryBtn}>Create login</button>
            </form>
          </section>

          {/* Sales (admin-only, coming) */}
          <section style={{ ...cardBox, gridColumn: "1 / -1" }}>
            <h2 style={h2}>Sales &amp; revenue</h2>
            <p style={hint}>
              Visible to you (admin) only — never to supervisors or waiters. This fills in once order tracking is switched on
              for your branches.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["Today's sales", "Orders", "Avg. order value"].map((k) => (
                <div key={k} style={stat}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#c2c7cf" }}>—</div>
                  <div style={{ fontSize: 11.5, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 0.4 }}>{k}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#f3efe7", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif", padding: "0 0 50px" };
const topbar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: "#fff", borderBottom: "1px solid #ece7dd" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 16, padding: 22, maxWidth: 1000, margin: "0 auto" };
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
const code: React.CSSProperties = { display: "block", marginTop: 6, fontSize: 11, background: "#f6f2ea", border: "1px solid #ece7dd", borderRadius: 8, padding: "6px 8px", color: "#6b5b45", overflowX: "auto", whiteSpace: "nowrap" };
const stat: React.CSSProperties = { flex: 1, minWidth: 130, background: "#faf7f0", border: "1px solid #ece7dd", borderRadius: 12, padding: "14px 16px" };
const tag = (role: string): React.CSSProperties => ({
  fontSize: 10.5,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  padding: "2px 7px",
  borderRadius: 10,
  marginLeft: 6,
  background: role === "supervisor" ? "#e6f1fb" : "#eaf3de",
  color: role === "supervisor" ? "#185fa5" : "#3b6d11",
});
