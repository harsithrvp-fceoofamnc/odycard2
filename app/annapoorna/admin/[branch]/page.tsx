"use client";

// odysra.com/annapoorna/admin/<branch> — per-branch menu manager.
// Add / edit / hide / delete dishes for one outlet. Overrides persist in the browser
// (localStorage, keyed per branch) until the DB is wired; then this drives the live menu.
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MENU_DATA, CATEGORIES, Dish } from "../menuData";

const BRANCHES = [
  { name: "RS Puram", slug: "rs-puram" },
  { name: "Gandhipuram", slug: "gandhipuram" },
  { name: "Town Hall", slug: "town-hall" },
  { name: "Saibaba Colony", slug: "saibaba-colony" },
  { name: "Peelamedu", slug: "peelamedu" },
  { name: "Singanallur", slug: "singanallur" },
];

type Ov = {
  hidden: Record<string, boolean>;
  edits: Record<string, { name?: string; price?: number }>;
  deleted: Record<string, boolean>;
  added: Dish[];
};
const EMPTY: Ov = { hidden: {}, edits: {}, deleted: {}, added: [] };

export default function BranchMenu() {
  const params = useParams();
  const slug = String((params?.branch as string) || "");
  const branch = BRANCHES.find((b) => b.slug === slug);

  const [ov, setOv] = useState<Ov>(EMPTY);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [nName, setNName] = useState("");
  const [nPrice, setNPrice] = useState("");
  const [nCat, setNCat] = useState(CATEGORIES[0]);
  const [showRemoved, setShowRemoved] = useState(false);

  const key = "ody_menu_" + slug;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setOv({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
  }, [key]);
  const save = (next: Ov) => {
    setOv(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };

  if (!branch) {
    return (
      <div style={{ minHeight: "100vh", background: "#efe7d4", color: "#33281a", padding: 30, fontFamily: "sans-serif" }}>
        <p>Unknown branch.</p>
        <a href="/annapoorna/admin" style={{ color: "#7a4a24", fontWeight: 700 }}>← Back to admin</a>
      </div>
    );
  }

  // Build the working list: base (minus deleted) + added, with edits + hidden applied.
  const base = MENU_DATA.filter((d) => !ov.deleted[d.id]);
  const addedIds = new Set(ov.added.map((a) => a.id));
  const all: (Dish & { hidden: boolean; isAdded: boolean })[] = [...base, ...ov.added].map((d) => {
    const e = ov.edits[d.id] || {};
    return { ...d, name: e.name ?? d.name, price: e.price ?? d.price, hidden: !!ov.hidden[d.id], isAdded: addedIds.has(d.id) };
  });
  const view = all.filter(
    (d) => (cat === "all" || d.cat === cat) && (!q || d.name.toLowerCase().includes(q.toLowerCase()))
  );
  const cats = [...CATEGORIES, ...ov.added.map((a) => a.cat)].filter((c, i, a) => a.indexOf(c) === i);
  const grouped = cats.map((c) => ({ cat: c, items: view.filter((d) => d.cat === c) })).filter((g) => g.items.length);
  const removed = MENU_DATA.filter((d) => ov.deleted[d.id]);

  const toggleHide = (id: string) => save({ ...ov, hidden: { ...ov.hidden, [id]: !ov.hidden[id] } });
  const del = (id: string, isAdded: boolean) => {
    if (isAdded) {
      const { [id]: _e, ...edits } = ov.edits; const { [id]: _h, ...hidden } = ov.hidden;
      save({ ...ov, added: ov.added.filter((a) => a.id !== id), edits, hidden });
    } else {
      save({ ...ov, deleted: { ...ov.deleted, [id]: true } });
    }
  };
  const restore = (id: string) => { const { [id]: _x, ...deleted } = ov.deleted; save({ ...ov, deleted }); };
  const beginEdit = (d: { id: string; name: string; price: number }) => { setEditId(d.id); setEName(d.name); setEPrice(String(d.price)); };
  const saveEdit = (id: string) => {
    const p = parseInt(ePrice, 10);
    save({ ...ov, edits: { ...ov.edits, [id]: { name: eName.trim() || undefined, price: isNaN(p) ? undefined : p } } });
    setEditId(null);
  };
  const addDish = () => {
    const p = parseInt(nPrice, 10);
    if (!nName.trim() || isNaN(p)) return;
    const id = "custom_" + Date.now();
    save({ ...ov, added: [...ov.added, { id, name: nName.trim(), price: p, cat: nCat, best: false }] });
    setNName(""); setNPrice("");
  };

  return (
    <div className="wrap">
      <style>{`
        html,body{background:#efe7d4!important;color:#33281a}
        .wrap{min-height:100vh;background:#efe7d4;color:#33281a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:0 0 56px}
        .head{background:linear-gradient(135deg,#5c3a1c,#3e2713);color:#f4ecdb;padding:18px 22px}
        .head a{color:#d9c7a6;text-decoration:none;font-size:12.5px;font-weight:600}
        .head h1{margin:6px 0 0;font-size:21px;font-weight:700}
        .head .sub{font-size:12.5px;color:#d9c7a6;margin-top:2px}
        .container{max-width:920px;margin:0 auto;padding:0 16px}
        .card{background:#fffdf7;border:1px solid #e7dcc5;border-radius:16px;padding:14px 16px;box-shadow:0 2px 10px rgba(122,74,36,.07);margin-top:16px;overflow-x:auto;-webkit-overflow-scrolling:touch}
        .dish .dn{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        @media(max-width:600px){.container{padding:0 11px}.head{padding:15px 14px}.head h1{font-size:19px}.card{padding:13px 13px}h2{font-size:14px}.btn{padding:5px 8px;font-size:11.5px}.dish{gap:7px}.acts{gap:4px}}
        h2{font-size:15px;font-weight:700;color:#5c3a1c;margin:22px 2px 4px}
        input,select{font-family:inherit;font-size:13.5px;color:#33281a;background:#fffdf7;border:1px solid #d9c9a6;border-radius:10px;padding:8px 11px;outline:none}
        input:focus,select:focus{border-color:#c79233}
        .tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
        .tools .search{flex:1;min-width:160px}
        .addrow{display:flex;flex-wrap:wrap;gap:9px;align-items:flex-end}
        .addrow .fld{display:flex;flex-direction:column;gap:4px}
        .addrow .fld label{font-size:11px;color:#9c8e76;font-weight:600}
        .addbtn{background:linear-gradient(135deg,#5c3a1c,#3e2713);color:#f4ecdb;border:0;font-weight:700;font-size:13.5px;padding:10px 16px;border-radius:11px;cursor:pointer}
        .catname{font-size:12px;font-weight:700;color:#9a6a1f;text-transform:uppercase;letter-spacing:.4px;margin:16px 2px 6px}
        .dish{display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid #f1e9d6}
        .dish:last-child{border-bottom:0}
        .veg{width:14px;height:14px;border:2px solid #2e7d32;border-radius:3px;position:relative;flex:0 0 auto}
        .veg::after{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:6px;height:6px;border-radius:50%;background:#2e7d32}
        .dn{font-weight:600;color:#3e2713;flex:1}
        .dn.hid{color:#b9ab92;text-decoration:line-through}
        .price{font-weight:700;color:#7a4a24;width:62px;text-align:right}
        .badge{font-size:10px;font-weight:700;color:#9a6a1f;background:#f7eccf;border-radius:8px;padding:1px 6px;margin-left:7px}
        .newbadge{font-size:10px;font-weight:700;color:#1d7a55;background:#e3f3ea;border-radius:8px;padding:1px 6px;margin-left:7px}
        .acts{display:flex;gap:6px;flex:0 0 auto}
        .btn{font-size:12px;font-weight:600;padding:5px 10px;border-radius:9px;cursor:pointer;border:1px solid #ddcdb0;background:#fffdf7;color:#7a4a24}
        .btn.warn{border-color:#e2cfcf;color:#a3552a}
        .btn.go{background:linear-gradient(135deg,#5c3a1c,#3e2713);color:#f4ecdb;border-color:#3e2713}
        .editrow{display:flex;gap:8px;align-items:center;flex:1}
        .editrow input.en{flex:1}
        .editrow input.ep{width:80px}
        .muted{color:#9c8e76;font-size:12.5px}
        .rmlink{color:#9a6a1f;font-weight:700;cursor:pointer;font-size:12.5px}
      `}</style>

      <div className="head">
        <a href="/annapoorna/admin">← Admin</a>
        <h1>{branch.name} · Menu</h1>
        <div className="sub">Add, edit, hide or delete dishes for this outlet</div>
      </div>

      <div className="container">
        <h2>Add a dish</h2>
        <div className="card">
          <div className="addrow">
            <div className="fld" style={{ flex: 1, minWidth: 180 }}>
              <label>Dish name</label>
              <input value={nName} placeholder="e.g. Ragi Dosa" onChange={(e) => setNName(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="fld">
              <label>Price ₹</label>
              <input value={nPrice} inputMode="numeric" placeholder="0" onChange={(e) => setNPrice(e.target.value)} style={{ width: 90 }} />
            </div>
            <div className="fld">
              <label>Category</label>
              <select value={nCat} onChange={(e) => setNCat(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button className="addbtn" onClick={addDish}>+ Add dish</button>
          </div>
        </div>

        <h2>Menu ({view.length})</h2>
        <div className="card">
          <div className="tools" style={{ marginBottom: 6 }}>
            <input className="search" value={q} placeholder="Search dishes…" onChange={(e) => setQ(e.target.value)} />
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {grouped.map((g) => (
            <div key={g.cat}>
              <div className="catname">{g.cat}</div>
              {g.items.map((d) => (
                <div className="dish" key={d.id}>
                  <span className="veg" />
                  {editId === d.id ? (
                    <div className="editrow">
                      <input className="en" value={eName} onChange={(e) => setEName(e.target.value)} />
                      <input className="ep" value={ePrice} inputMode="numeric" onChange={(e) => setEPrice(e.target.value)} />
                      <button className="btn go" onClick={() => saveEdit(d.id)}>Save</button>
                      <button className="btn" onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className={"dn" + (d.hidden ? " hid" : "")}>
                        {d.name}
                        {d.best && <span className="badge">BESTSELLER</span>}
                        {d.isAdded && <span className="newbadge">NEW</span>}
                        {d.hidden && <span className="badge">HIDDEN</span>}
                      </span>
                      <span className="price">₹{d.price}</span>
                      <span className="acts">
                        <button className="btn" onClick={() => beginEdit(d)}>Edit</button>
                        <button className="btn" onClick={() => toggleHide(d.id)}>{d.hidden ? "Show" : "Hide"}</button>
                        <button className="btn warn" onClick={() => del(d.id, d.isAdded)}>Delete</button>
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
          {view.length === 0 && <div className="muted" style={{ padding: "12px 4px" }}>No dishes match.</div>}
        </div>

        {removed.length > 0 && (
          <>
            <h2>Removed dishes ({removed.length})</h2>
            <div className="card">
              <span className="rmlink" onClick={() => setShowRemoved(!showRemoved)}>
                {showRemoved ? "Hide list" : "Show list"}
              </span>
              {showRemoved && removed.map((d) => (
                <div className="dish" key={d.id}>
                  <span className="dn" style={{ color: "#b9ab92" }}>{d.name}</span>
                  <span className="price">₹{d.price}</span>
                  <span className="acts"><button className="btn go" onClick={() => restore(d.id)}>Restore</button></span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="muted" style={{ marginTop: 24, textAlign: "center" }}>
          Changes are saved for this branch on this device. They drive the live chatbot menu once the database is connected.
        </div>
      </div>
    </div>
  );
}
