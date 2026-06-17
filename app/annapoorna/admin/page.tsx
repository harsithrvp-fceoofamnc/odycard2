"use client";

// odysra.com/annapoorna/admin — HQ admin dashboard (lean MVP).
// Runs on realistic SAMPLE data for now; swap to the database once chatbot logging is wired.
// Supervisors are stored in the browser (localStorage) until the DB + Auth0 are added.
import { useState, useEffect } from "react";

type Branch = {
  name: string; slug: string;
  orders: number; aov: number; rating: number;
  topDish: string; busy: string; lang: string;
};
type Sup = { name: string; outlet: string; phone: string };

const BRANCHES: Branch[] = [
  { name: "RS Puram", slug: "rs-puram", orders: 4120, aov: 124, rating: 4.6, topDish: "Ghee Roast", busy: "8–9 AM", lang: "Tamil 62%" },
  { name: "Gandhipuram", slug: "gandhipuram", orders: 4480, aov: 109, rating: 4.4, topDish: "Idly (2)", busy: "1–2 PM", lang: "Tamil 58%" },
  { name: "Town Hall", slug: "town-hall", orders: 3650, aov: 121, rating: 4.5, topDish: "Masal Roast", busy: "8–9 AM", lang: "Tamil 60%" },
  { name: "Saibaba Colony", slug: "saibaba-colony", orders: 3120, aov: 132, rating: 4.7, topDish: "Rajabhojanam", busy: "1–2 PM", lang: "Tamil 55%" },
  { name: "Peelamedu", slug: "peelamedu", orders: 3380, aov: 116, rating: 4.3, topDish: "Veg Briyani", busy: "8–9 PM", lang: "Hindi 28%" },
  { name: "Singanallur", slug: "singanallur", orders: 2890, aov: 119, rating: 4.5, topDish: "Pongal", busy: "7–8 AM", lang: "Malayalam 22%" },
];

const FEEDBACK = [
  { topic: "Food & Taste", score: 4.6 }, { topic: "Cleanliness", score: 4.5 },
  { topic: "Staff", score: 4.4 }, { topic: "Ambience", score: 4.4 },
  { topic: "Service", score: 4.3 }, { topic: "Value for Money", score: 4.2 },
  { topic: "App Experience", score: 4.7 },
];
const TOP_DISHES = [
  { name: "Filter Coffee", orders: 4300 }, { name: "Ghee Roast", orders: 3120 },
  { name: "Idly (2)", orders: 2980 }, { name: "Masal Roast", orders: 2240 },
  { name: "Pongal", orders: 1980 }, { name: "South Indian Meals", orders: 1760 },
];
const LANG_MIX = [
  { lang: "Tamil", pct: 57 }, { lang: "Hindi", pct: 14 }, { lang: "Malayalam", pct: 11 },
  { lang: "Telugu", pct: 9 }, { lang: "English", pct: 6 }, { lang: "Kannada", pct: 3 },
];
const LANG_FAV = [
  { lang: "Tamil", dish: "Ghee Roast" }, { lang: "Hindi", dish: "Channa Bhatura" },
  { lang: "Malayalam", dish: "Aappam w/ Stew" }, { lang: "Telugu", dish: "Veg Briyani" },
  { lang: "Kannada", dish: "Masal Roast" }, { lang: "English", dish: "Veg Noodles" },
];
const DROPOFFS = [
  { name: "Family Roast", added: 210, ordered: 96 }, { name: "Rajabhojanam", added: 188, ordered: 121 },
  { name: "Paneer Butter Masala", added: 164, ordered: 92 }, { name: "Special Hyderabadi Briyani", added: 142, ordered: 71 },
];
const ALERTS = [
  { kind: "warn", text: "Peelamedu lunch (1–2 PM) is running ~18% below the chain average — push the Executive Lunch combo there." },
  { kind: "idea", text: "Singanallur: Malayalam guests are up to 22% — feature Aappam & Idiyappam at the top of the menu." },
  { kind: "warn", text: "Value-for-Money (4.2) is the lowest-rated topic chain-wide — review pricing on premium gravies." },
  { kind: "idea", text: "Filter Coffee is viewed 2.3× more than it's ordered in the evenings — try a coffee + snack combo." },
];
const RANGES = [
  { key: "today", label: "Today", factor: 1 / 30 },
  { key: "7d", label: "7 days", factor: 7 / 30 },
  { key: "30d", label: "30 days", factor: 1 },
];
const SEED_SUPS: Sup[] = [
  { name: "Suresh Kumar", outlet: "RS Puram", phone: "98430 11122" },
  { name: "Lakshmi Ramesh", outlet: "Gandhipuram", phone: "94890 33344" },
];

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const compact = (n: number) =>
  n >= 100000 ? "₹" + (n / 100000).toFixed(1).replace(/\.0$/, "") + "L"
  : n >= 1000 ? "₹" + (n / 1000).toFixed(0) + "k"
  : "₹" + Math.round(n);

export default function Admin() {
  const [range, setRange] = useState(RANGES[2]);
  const [outlet, setOutlet] = useState("all"); // "all" or a branch slug
  const [sups, setSups] = useState<Sup[]>([]);
  const [form, setForm] = useState<Sup>({ name: "", outlet: BRANCHES[0].name, phone: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ody_supervisors");
      setSups(raw ? JSON.parse(raw) : SEED_SUPS);
    } catch { setSups(SEED_SUPS); }
  }, []);
  const persist = (list: Sup[]) => {
    setSups(list);
    try { localStorage.setItem("ody_supervisors", JSON.stringify(list)); } catch {}
  };
  const addSup = () => {
    if (!form.name.trim()) return;
    persist([...sups, { name: form.name.trim(), outlet: form.outlet, phone: form.phone.trim() }]);
    setForm({ name: "", outlet: form.outlet, phone: "" });
  };
  const removeSup = (i: number) => persist(sups.filter((_, idx) => idx !== i));

  const f = range.factor;
  const shown = outlet === "all" ? BRANCHES : BRANCHES.filter((b) => b.slug === outlet);
  const totOrders = Math.round(shown.reduce((s, b) => s + b.orders, 0) * f);
  const totRev = shown.reduce((s, b) => s + b.orders * b.aov, 0) * f;
  const aov = totRev / (totOrders || 1);
  const guests = Math.round(totOrders * 1.7);
  const aiMsgs = Math.round(totOrders * 5.8);
  const avgRating = (shown.reduce((s, b) => s + b.rating, 0) / shown.length).toFixed(1);
  const outletName = outlet === "all" ? "All branches" : (BRANCHES.find((b) => b.slug === outlet)?.name || "");

  const kpis = [
    { label: "Orders", value: totOrders.toLocaleString("en-IN") },
    { label: "Revenue", value: compact(totRev) },
    { label: "Avg order value", value: inr(aov) },
    { label: "Guests served", value: guests.toLocaleString("en-IN") },
    { label: "AI messages", value: aiMsgs.toLocaleString("en-IN") },
    { label: "Avg rating", value: avgRating + " ★" },
  ];

  return (
    <div className="wrap">
      <style>{`
        html,body{background:#efe7d4!important;color:#33281a}
        .wrap{min-height:100vh;background:#efe7d4;color:#33281a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:0 0 48px}
        .head{background:linear-gradient(135deg,#5c3a1c,#3e2713);color:#f4ecdb;padding:20px 22px}
        .head h1{margin:0;font-size:22px;font-weight:700;letter-spacing:.2px}
        .head .sub{font-size:13px;color:#d9c7a6;margin-top:3px}
        .note{display:inline-block;margin-top:12px;font-size:12px;background:rgba(199,146,51,.22);color:#f0d9a8;border:1px solid rgba(199,146,51,.5);padding:5px 11px;border-radius:20px}
        .container{max-width:1080px;margin:0 auto;padding:0 16px}
        .toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin:18px 0 6px}
        .ranges{display:flex;gap:8px}
        .rg{border:1px solid #d9c9a6;background:#fffdf7;color:#7a4a24;font-size:13.5px;font-weight:600;padding:7px 16px;border-radius:20px;cursor:pointer}
        .rg.on{background:linear-gradient(135deg,#5c3a1c,#3e2713);color:#f4ecdb;border-color:#3e2713}
        .ofilter{display:flex;align-items:center;gap:8px;margin-left:auto}
        .ofilter label{font-size:12.5px;color:#9c8e76;font-weight:600}
        select,input{font-family:inherit;font-size:13.5px;color:#33281a;background:#fffdf7;border:1px solid #d9c9a6;border-radius:10px;padding:8px 11px;outline:none}
        select:focus,input:focus{border-color:#c79233}
        h2{font-size:15px;font-weight:700;color:#5c3a1c;margin:26px 0 12px;letter-spacing:.2px}
        .kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
        @media(max-width:760px){.kpis{grid-template-columns:repeat(2,1fr)}}
        .kpi{background:#fffdf7;border:1px solid #e7dcc5;border-radius:14px;padding:13px 14px;box-shadow:0 2px 8px rgba(122,74,36,.07)}
        .kpi .v{font-size:23px;font-weight:800;color:#3e2713}
        .kpi .l{font-size:12px;color:#9c8e76;margin-top:2px}
        .card{background:#fffdf7;border:1px solid #e7dcc5;border-radius:16px;padding:16px 18px;box-shadow:0 2px 10px rgba(122,74,36,.07)}
        .grid2{display:grid;grid-template-columns:1.3fr 1fr;gap:16px}
        @media(max-width:860px){.grid2{grid-template-columns:1fr}}
        table{width:100%;border-collapse:collapse;font-size:13.5px}
        th{text-align:left;color:#9c8e76;font-weight:600;font-size:12px;padding:8px 8px;border-bottom:1px solid #ece2cc}
        td{padding:9px 8px;border-bottom:1px solid #f1e9d6}
        tr:last-child td{border-bottom:0}
        .b-name{font-weight:700;color:#3e2713}
        .bar{height:9px;border-radius:5px;background:#ece2cc;overflow:hidden}
        .bar>span{display:block;height:100%;background:linear-gradient(90deg,#c79233,#9a6a1f)}
        .row{display:flex;align-items:center;gap:10px;margin:9px 0}
        .row .nm{width:118px;font-size:13px;color:#5c3a1c;font-weight:600;flex:0 0 auto}
        .row .val{width:42px;text-align:right;font-size:12.5px;color:#7a4a24;font-weight:700;flex:0 0 auto}
        .row .bar{flex:1}
        .alert{display:flex;gap:10px;padding:11px 13px;border-radius:12px;margin-bottom:9px;font-size:13.5px;line-height:1.4}
        .alert.warn{background:#fbf1e2;border:1px solid #eccf9b}
        .alert.idea{background:#eef4ea;border:1px solid #cfe0bd}
        .alert .ic{font-size:16px;flex:0 0 auto}
        .pill{font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:#f1e7d2;color:#7a4a24}
        .muted{color:#9c8e76;font-size:12.5px}
        a.branchlink{color:#7a4a24;text-decoration:none;font-weight:700}
        .supform{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:6px}
        .supform .fld{display:flex;flex-direction:column;gap:5px}
        .supform .fld label{font-size:11.5px;color:#9c8e76;font-weight:600}
        .supform input,.supform select{min-width:150px}
        .addbtn{background:linear-gradient(135deg,#5c3a1c,#3e2713);color:#f4ecdb;border:0;font-weight:700;font-size:13.5px;padding:10px 18px;border-radius:11px;cursor:pointer}
        .rm{background:none;border:1px solid #e2cfcf;color:#a3552a;font-size:12px;font-weight:600;padding:5px 11px;border-radius:9px;cursor:pointer}
      `}</style>

      <div className="head">
        <h1>Annapoorna · Admin</h1>
        <div className="sub">All branches · powered by Odysra</div>
        <span className="note">● Sample data — switches to live figures once chatbot logging is connected</span>
      </div>

      <div className="container">
        <div className="toolbar">
          <div className="ranges">
            {RANGES.map((r) => (
              <button key={r.key} className={"rg" + (r.key === range.key ? " on" : "")} onClick={() => setRange(r)}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="ofilter">
            <label htmlFor="ov">Outlet</label>
            <select id="ov" value={outlet} onChange={(e) => setOutlet(e.target.value)}>
              <option value="all">All branches</option>
              {BRANCHES.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <h2>Overview · {range.label} · {outletName}</h2>
        <div className="kpis">
          {kpis.map((k) => (
            <div className="kpi" key={k.label}><div className="v">{k.value}</div><div className="l">{k.label}</div></div>
          ))}
        </div>

        <h2>{outlet === "all" ? "Branches" : "Branch detail"}</h2>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Branch</th><th>Orders</th><th>Revenue</th><th>AOV</th>
                <th>Rating</th><th>Top dish</th><th>Busiest</th><th>Top language</th><th>Menu</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.slug}>
                  <td className="b-name"><a className="branchlink" href={"/annapoorna/" + b.slug}>{b.name}</a></td>
                  <td>{Math.round(b.orders * f).toLocaleString("en-IN")}</td>
                  <td>{compact(b.orders * b.aov * f)}</td>
                  <td>{inr(b.aov)}</td>
                  <td>{b.rating} ★</td>
                  <td>{b.topDish}</td>
                  <td>{b.busy}</td>
                  <td>{b.lang}</td>
                  <td><a className="branchlink" href={"/annapoorna/admin/" + b.slug}>Manage →</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Supervisors</h2>
        <div className="card">
          <div className="supform">
            <div className="fld">
              <label>Name</label>
              <input value={form.name} placeholder="Supervisor name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="fld">
              <label>Outlet</label>
              <select value={form.outlet} onChange={(e) => setForm({ ...form, outlet: e.target.value })}>
                {BRANCHES.map((b) => <option key={b.slug} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div className="fld">
              <label>Phone (optional)</label>
              <input value={form.phone} inputMode="tel" placeholder="98xxx xxxxx" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button className="addbtn" onClick={addSup}>+ Add supervisor</button>
          </div>
          <table>
            <thead>
              <tr><th>Name</th><th>Outlet</th><th>Phone</th><th></th></tr>
            </thead>
            <tbody>
              {sups.length === 0 && (
                <tr><td colSpan={4} className="muted" style={{ padding: "14px 8px" }}>No supervisors yet — add one above.</td></tr>
              )}
              {sups.map((s, i) => (
                <tr key={i}>
                  <td className="b-name">{s.name}</td>
                  <td><span className="pill">{s.outlet}</span></td>
                  <td>{s.phone || <span className="muted">—</span>}</td>
                  <td style={{ textAlign: "right" }}><button className="rm" onClick={() => removeSup(i)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted" style={{ marginTop: 10 }}>
            Saved on this device for now. Once Auth0 is added, each supervisor gets a login that opens only their outlet.{" "}
            <a className="branchlink" href="/annapoorna/supervisor">Open the supervisor view →</a>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="card">
            <h2 style={{ margin: "0 0 12px" }}>Feedback by topic</h2>
            {FEEDBACK.map((t) => (
              <div className="row" key={t.topic}>
                <span className="nm">{t.topic}</span>
                <span className="bar"><span style={{ width: (t.score / 5) * 100 + "%" }} /></span>
                <span className="val">{t.score.toFixed(1)}</span>
              </div>
            ))}
            <div className="muted" style={{ marginTop: 10 }}>Average across all six branches, 1–5 stars.</div>
          </div>
          <div className="card">
            <h2 style={{ margin: "0 0 12px" }}>Language mix</h2>
            {LANG_MIX.map((l) => (
              <div className="row" key={l.lang}>
                <span className="nm">{l.lang}</span>
                <span className="bar"><span style={{ width: l.pct + "%" }} /></span>
                <span className="val">{l.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="card">
            <h2 style={{ margin: "0 0 12px" }}>Top dishes · {range.label}</h2>
            <table><tbody>
              {TOP_DISHES.map((d, i) => (
                <tr key={d.name}>
                  <td style={{ width: 26, color: "#9c8e76" }}>{i + 1}</td>
                  <td className="b-name">{d.name}</td>
                  <td style={{ textAlign: "right" }}>{Math.round(d.orders * f).toLocaleString("en-IN")} orders</td>
                </tr>
              ))}
            </tbody></table>
          </div>
          <div className="card">
            <h2 style={{ margin: "0 0 12px" }}>Language favourites</h2>
            <table><tbody>
              {LANG_FAV.map((l) => (
                <tr key={l.lang}>
                  <td><span className="pill">{l.lang}</span></td>
                  <td className="b-name" style={{ textAlign: "right" }}>{l.dish}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </div>

        <h2>Cart drop-offs · added but not ordered</h2>
        <div className="card">
          <table>
            <thead><tr><th>Dish</th><th>Added to cart</th><th>Ordered</th><th>Drop-off</th></tr></thead>
            <tbody>
              {DROPOFFS.map((d) => {
                const drop = Math.round((1 - d.ordered / d.added) * 100);
                return (
                  <tr key={d.name}>
                    <td className="b-name">{d.name}</td>
                    <td>{Math.round(d.added * f)}</td>
                    <td>{Math.round(d.ordered * f)}</td>
                    <td style={{ color: drop > 45 ? "#a3552a" : "#7a4a24", fontWeight: 700 }}>{drop}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2>AI recommendations</h2>
        <div>
          {ALERTS.map((a, i) => (
            <div className={"alert " + a.kind} key={i}>
              <span className="ic">{a.kind === "warn" ? "⚠️" : "💡"}</span>
              <span>{a.text}</span>
            </div>
          ))}
        </div>

        <div className="muted" style={{ marginTop: 28, textAlign: "center" }}>
          Odysra · AI Waiter analytics — sample preview. Live data, supervisor logins & menu management coming next.
        </div>
      </div>
    </div>
  );
}
