"use client";

// odysra.com/restaurant/supervisor — sample SUPERVISOR view (one branch).
// What a branch supervisor signs into: their own branch's numbers, sales-CSV upload to
// seed the system, branch info, and a link to manage their menu. Sample data + browser
// storage for now; each supervisor will log in to only their branch once Auth0 is added.
import { useState, useEffect } from "react";

type Branch = { name: string; slug: string; orders: number; aov: number; rating: number; topDish: string; lang: string; busy: string };
const BRANCHES: Branch[] = [
  { name: "Main Branch", slug: "main-branch", orders: 4120, aov: 124, rating: 4.6, topDish: "Ghee Roast", lang: "Tamil 62%", busy: "8–9 AM" },
  { name: "City Centre", slug: "city-centre", orders: 4480, aov: 109, rating: 4.4, topDish: "Idly (2)", lang: "Tamil 58%", busy: "1–2 PM" },
  { name: "Marina", slug: "marina", orders: 3650, aov: 121, rating: 4.5, topDish: "Masal Roast", lang: "Tamil 60%", busy: "8–9 AM" },
  { name: "Highway Road", slug: "highway-road", orders: 3120, aov: 132, rating: 4.7, topDish: "Rajabhojanam", lang: "Tamil 55%", busy: "1–2 PM" },
  { name: "Tech Park", slug: "tech-park", orders: 3380, aov: 116, rating: 4.3, topDish: "Veg Briyani", lang: "Hindi 28%", busy: "8–9 PM" },
  { name: "Lakeview", slug: "lakeview", orders: 2890, aov: 119, rating: 4.5, topDish: "Pongal", lang: "Malayalam 22%", busy: "7–8 AM" },
];
const TOP = ["Filter Coffee", "Ghee Roast", "Idly (2)", "Masal Roast", "Pongal", "South Indian Meals"];
const TOPICS = ["Food & Taste", "Cleanliness", "Staff", "Ambience", "Service", "Value for Money", "App Experience"];
const RANGES = [
  { key: "today", label: "Today", factor: 1 / 30 },
  { key: "7d", label: "7 days", factor: 7 / 30 },
  { key: "30d", label: "30 days", factor: 1 },
];
type BInfo = { timings: string; phone: string; parking: string; halls: string; banquet: string };
const SEED_INFO: BInfo = {
  timings: "6:30 AM – 11:00 PM, all days", phone: "+91 98765 43210",
  parking: "Valet parking available", halls: "AC & Non-AC dining halls",
  banquet: "Banquet hall — up to 200 guests",
};
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const compact = (n: number) => (n >= 100000 ? "₹" + (n / 100000).toFixed(1).replace(/\.0$/, "") + "L" : n >= 1000 ? "₹" + (n / 1000).toFixed(0) + "k" : "₹" + Math.round(n));

export default function Supervisor() {
  const [bi, setBi] = useState(0); // which branch (simulated login)
  const [range, setRange] = useState(RANGES[2]);
  const [info, setInfo] = useState<BInfo>(SEED_INFO);
  const [savedMsg, setSavedMsg] = useState(false);
  const [csv, setCsv] = useState<{ name: string; count: number; preview: string[][] } | null>(null);

  const b = BRANCHES[bi];
  const key = "rest_binfo_" + b.slug;
  useEffect(() => {
    try { const raw = localStorage.getItem(key); setInfo(raw ? { ...SEED_INFO, ...JSON.parse(raw) } : SEED_INFO); }
    catch { setInfo(SEED_INFO); }
    setCsv(null);
  }, [key]);
  const saveInfo = () => {
    try { localStorage.setItem(key, JSON.stringify(info)); } catch {}
    setSavedMsg(true); setTimeout(() => setSavedMsg(false), 1800);
  };

  const f = range.factor;
  const orders = Math.round(b.orders * f);
  const rev = b.orders * b.aov * f;
  const guests = Math.round(orders * 1.7);
  const aiMsgs = Math.round(orders * 5.8);
  const kpis = [
    { l: "Orders", v: orders.toLocaleString("en-IN") },
    { l: "Revenue", v: compact(rev) },
    { l: "Avg order value", v: inr(b.aov) },
    { l: "Guests served", v: guests.toLocaleString("en-IN") },
    { l: "AI messages", v: aiMsgs.toLocaleString("en-IN") },
    { l: "Rating", v: b.rating + " ★" },
  ];
  const share = b.orders / 4480; // scale top-dish counts to this branch
  const topRows = TOP.map((n, i) => ({ name: n, orders: Math.round([4300, 3120, 2980, 2240, 1980, 1760][i] * share * f) }));
  const topicRows = TOPICS.map((t, i) => ({ t, s: Math.max(3.9, Math.min(4.9, b.rating + [0.0, -0.1, -0.2, -0.2, -0.3, -0.4, 0.1][i])) }));

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const text = String(r.result || "");
      const rows = text.split(/\r?\n/).filter((l) => l.trim());
      setCsv({ name: file.name, count: Math.max(0, rows.length - 1), preview: rows.slice(0, 5).map((l) => l.split(",").slice(0, 5)) });
    };
    r.readAsText(file);
  };

  return (
    <div className="wrap">
      <style>{`
        html,body{background:#f4f5f7!important;color:#1f2430}
        .wrap{min-height:100vh;background:#f4f5f7;color:#1f2430;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:0 0 48px}
        .head{background:linear-gradient(135deg,#2b313a,#161a20);color:#f4ecdb;padding:18px 22px}
        .head h1{margin:0;font-size:21px;font-weight:700}
        .head .sub{font-size:12.5px;color:#aeb4bf;margin-top:3px}
        .note{display:inline-block;margin-top:11px;font-size:12px;background:rgba(199,146,51,.22);color:#f0d9a8;border:1px solid rgba(199,146,51,.5);padding:5px 11px;border-radius:20px}
        .container{max-width:980px;margin:0 auto;padding:0 16px}
        .toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin:18px 0 4px}
        .ranges{display:flex;gap:8px}
        .rg{border:1px solid #d7dbe2;background:#ffffff;color:#2b313a;font-size:13px;font-weight:600;padding:7px 15px;border-radius:20px;cursor:pointer}
        .rg.on{background:linear-gradient(135deg,#2b313a,#161a20);color:#f4ecdb;border-color:#161a20}
        .who{display:flex;align-items:center;gap:8px;margin-left:auto}
        .who label{font-size:12.5px;color:#8a909c;font-weight:600}
        select,input,textarea{font-family:inherit;font-size:13.5px;color:#1f2430;background:#ffffff;border:1px solid #d7dbe2;border-radius:10px;padding:8px 11px;outline:none}
        select:focus,input:focus,textarea:focus{border-color:#c79233}
        h2{font-size:15px;font-weight:700;color:#2b313a;margin:24px 2px 10px}
        .kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
        @media(max-width:760px){.kpis{grid-template-columns:repeat(2,1fr)}}
        .kpi{background:#ffffff;border:1px solid #e7e9ee;border-radius:14px;padding:12px 13px;box-shadow:0 2px 8px rgba(122,74,36,.07)}
        .kpi .v{font-size:22px;font-weight:800;color:#161a20}
        .kpi .l{font-size:11.5px;color:#8a909c;margin-top:2px}
        .card{background:#ffffff;border:1px solid #e7e9ee;border-radius:16px;padding:15px 17px;box-shadow:0 2px 10px rgba(122,74,36,.07);overflow-x:auto;-webkit-overflow-scrolling:touch}
        @media(max-width:600px){.container{padding:0 11px}.head{padding:15px 14px}.head h1{font-size:19px}.card{padding:13px 13px}h2{font-size:14px}.kpi .v{font-size:18px}table{font-size:12.5px}th,td{white-space:nowrap}.who{margin-left:0}}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        @media(max-width:820px){.grid2{grid-template-columns:1fr}}
        table{width:100%;border-collapse:collapse;font-size:13.5px}
        td{padding:8px 6px;border-bottom:1px solid #eef0f3}
        tr:last-child td{border-bottom:0}
        .b-name{font-weight:700;color:#161a20}
        .row{display:flex;align-items:center;gap:10px;margin:8px 0}
        .row .nm{width:118px;font-size:13px;color:#2b313a;font-weight:600;flex:0 0 auto}
        .row .val{width:40px;text-align:right;font-size:12.5px;color:#2b313a;font-weight:700;flex:0 0 auto}
        .bar{flex:1;height:9px;border-radius:5px;background:#eef0f3;overflow:hidden}
        .bar>span{display:block;height:100%;background:linear-gradient(90deg,#c79233,#b07d1e)}
        .drop{border:1.5px dashed #c7ccd4;border-radius:13px;padding:18px;text-align:center;background:#fbfcfd}
        .drop input{display:none}
        .uplabel{display:inline-block;background:linear-gradient(135deg,#2b313a,#161a20);color:#f4ecdb;font-weight:700;font-size:13.5px;padding:10px 18px;border-radius:11px;cursor:pointer}
        .muted{color:#8a909c;font-size:12.5px}
        .infogrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:680px){.infogrid{grid-template-columns:1fr}}
        .fld{display:flex;flex-direction:column;gap:5px}
        .fld label{font-size:11.5px;color:#8a909c;font-weight:600}
        .savebtn{background:linear-gradient(135deg,#2b313a,#161a20);color:#f4ecdb;border:0;font-weight:700;font-size:13.5px;padding:10px 20px;border-radius:11px;cursor:pointer;margin-top:12px}
        .menubtn{display:inline-block;background:#ffffff;border:1px solid #d7dbe2;color:#2b313a;font-weight:700;font-size:13.5px;padding:10px 18px;border-radius:11px;text-decoration:none}
        .ok{color:#1d7a55;font-size:12.5px;font-weight:700;margin-left:10px}
      `}</style>

      <div className="head">
        <h1>Odysra · Supervisor</h1>
        <div className="sub">{b.name} branch</div>
        <span className="note">● Sample — each supervisor will sign in to only their own branch once Auth0 is added</span>
      </div>

      <div className="container">
        <div className="toolbar">
          <div className="ranges">
            {RANGES.map((r) => (
              <button key={r.key} className={"rg" + (r.key === range.key ? " on" : "")} onClick={() => setRange(r)}>{r.label}</button>
            ))}
          </div>
          <div className="who">
            <label htmlFor="who">Signed in as</label>
            <select id="who" value={bi} onChange={(e) => setBi(Number(e.target.value))}>
              {BRANCHES.map((br, i) => <option key={br.slug} value={i}>{br.name} supervisor</option>)}
            </select>
          </div>
        </div>

        <h2>My branch · {range.label}</h2>
        <div className="kpis">
          {kpis.map((k) => <div className="kpi" key={k.l}><div className="v">{k.v}</div><div className="l">{k.l}</div></div>)}
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="card">
            <h2 style={{ margin: "0 0 10px" }}>Top dishes</h2>
            <table><tbody>
              {topRows.map((d, i) => (
                <tr key={d.name}><td style={{ width: 24, color: "#8a909c" }}>{i + 1}</td><td className="b-name">{d.name}</td><td style={{ textAlign: "right" }}>{d.orders.toLocaleString("en-IN")}</td></tr>
              ))}
            </tbody></table>
          </div>
          <div className="card">
            <h2 style={{ margin: "0 0 10px" }}>Feedback by topic</h2>
            {topicRows.map((t) => (
              <div className="row" key={t.t}><span className="nm">{t.t}</span><span className="bar"><span style={{ width: (t.s / 5) * 100 + "%" }} /></span><span className="val">{t.s.toFixed(1)}</span></div>
            ))}
          </div>
        </div>

        <h2>Upload past sales (CSV)</h2>
        <div className="card">
          <div className="drop">
            <label className="uplabel">Choose CSV file<input type="file" accept=".csv,text/csv" onChange={onFile} /></label>
            <div className="muted" style={{ marginTop: 10 }}>Upload your branch's past bills to seed the insight engine. Demo only for now — the file is read in your browser, not stored.</div>
          </div>
          {csv && (
            <div style={{ marginTop: 14 }}>
              <div className="b-name" style={{ marginBottom: 6 }}>{csv.name} · {csv.count} rows</div>
              <table>
                <tbody>
                  {csv.preview.map((r, ri) => (
                    <tr key={ri}>{r.map((c, ci) => <td key={ci} style={ri === 0 ? { fontWeight: 700, color: "#2b313a" } : {}}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              <div className="muted" style={{ marginTop: 6 }}>Showing first {csv.preview.length} rows. Once the database is connected, this seeds the branch's analysis.</div>
            </div>
          )}
        </div>

        <h2>Branch information</h2>
        <div className="card">
          <div className="infogrid">
            <div className="fld"><label>Timings</label><input value={info.timings} onChange={(e) => setInfo({ ...info, timings: e.target.value })} /></div>
            <div className="fld"><label>Phone</label><input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></div>
            <div className="fld"><label>Parking</label><input value={info.parking} onChange={(e) => setInfo({ ...info, parking: e.target.value })} /></div>
            <div className="fld"><label>Dining halls</label><input value={info.halls} onChange={(e) => setInfo({ ...info, halls: e.target.value })} /></div>
            <div className="fld" style={{ gridColumn: "1 / -1" }}><label>Banquet</label><input value={info.banquet} onChange={(e) => setInfo({ ...info, banquet: e.target.value })} /></div>
          </div>
          <button className="savebtn" onClick={saveInfo}>Save branch info</button>
          {savedMsg && <span className="ok">✓ Saved</span>}
        </div>

        <h2>Menu</h2>
        <div className="card">
          <a className="menubtn" href={"/restaurant/admin/" + b.slug}>Manage this branch's menu →</a>
          <div className="muted" style={{ marginTop: 10 }}>Add, edit, hide or delete dishes for {b.name} — keeps the live menu current.</div>
        </div>

        <div className="muted" style={{ marginTop: 26, textAlign: "center" }}>
          Odysra · Supervisor view — sample. Sign-in, real data & saved uploads arrive with the database + Auth0.
        </div>
      </div>
    </div>
  );
}
