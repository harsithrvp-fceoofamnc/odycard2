"use client";
import { useCallback, useEffect, useState } from "react";

// The AI Manager "Business Capsule" as a self-contained dark panel. Drops onto the owner
// dashboard AND powers the full-screen /bon-bon/insights view. Every number here is real,
// straight from /api/bonbon/insights (orders + the chat journal). No mock data.

type Board = { label: string; qty: number; rev: number };
type Ins = {
  conversations: number;
  askedButMissing: number;
  gaps: { label: string; count: number }[];
  flavors: { label: string; count: number }[];
  orders: number;
  totalRevenue: number;
  leaderboard: Board[];
  trend: { day: string; revenue: number; orders: number }[];
  seeded?: boolean;
  period?: string | null;
  itemsSold?: number | null;
};

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
function cap(s: string) {
  return String(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AiManagerPanel() {
  const [week, setWeek] = useState<Ins | null>(null);
  const [day, setDay] = useState<Ins | null>(null);
  const [tab, setTab] = useState<"d24" | "wk">("wk");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [w, d] = await Promise.all([
        fetch("/api/bonbon/insights?days=7").then((r) => r.json()),
        fetch("/api/bonbon/insights?days=1").then((r) => r.json()),
      ]);
      setWeek(w);
      setDay(d);
    } catch {
      /* leave nulls -> empty state */
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const board = (tab === "wk" ? week : day)?.leaderboard || [];
  const revenue = week?.totalRevenue || 0;
  const orders = week?.orders || 0;
  const convos = week?.conversations || 0;
  const unmet = week?.askedButMissing || 0;
  const gaps = week?.gaps || [];
  const flavors = week?.flavors || [];
  const trend = week?.trend || [];
  const seeded = !!week?.seeded;
  const period = week?.period || "";
  const empty = !loading && revenue === 0 && orders === 0 && convos === 0;

  const topSeller = week?.leaderboard[0];
  const topGap = gaps[0];
  const read = empty
    ? "No data yet. As orders and chats come in, your read will appear here."
    : [
        seeded
          ? `In ${period} you did ${inr(revenue)} — here's what carried it.`
          : `You did ${inr(revenue)}${orders ? ` across ${orders} orders` : ""} this week.`,
        topSeller ? `${cap(topSeller.label)} is your top seller.` : "",
        topGap ? `${topGap.count} guests asked for ${topGap.label} you don't stock — your biggest gap.` : "",
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <div className="aim">
      <style>{CSS}</style>
      <div className="wrap">
        <div className="phead-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/logo_web.png" alt="Bon Bon" />
          <div>
            <div className="pttl">AI Manager</div>
            <div className="psub">Your business, read by AI</div>
          </div>
        </div>

        <div className="card maroon">
          <div className="eyebrow">✦ This week&apos;s read</div>
          <div className="read serif">{loading ? "Reading your week…" : read}</div>
        </div>

        <div className="kpis">
          <Kpi n={inr(revenue)} l="Revenue" />
          {seeded ? <Kpi n={(week?.itemsSold || 0).toLocaleString("en-IN")} l="Items sold" /> : <Kpi n={String(orders)} l="Orders" />}
          <Kpi n={String(convos)} l="Conversations" />
          <Kpi n={String(unmet)} l="Unmet requests" warn />
        </div>

        <div className="card glass">
          <div className="lbhead">
            <div className="eyebrow">Points table</div>
            <div className="lbtabs">
              <button className={tab === "d24" ? "on" : ""} onClick={() => setTab("d24")}>Last 24h</button>
              <button className={tab === "wk" ? "on" : ""} onClick={() => setTab("wk")}>This week</button>
            </div>
          </div>
          <div className="lbcols"><span className="c1">#</span><span className="c2">Dish</span><span className="c3">Sold</span><span className="c4">Sales</span></div>
          {board.length === 0 ? (
            <div className="muted">No sales in this window yet.</div>
          ) : (
            board.slice(0, 8).map((r, i) => (
              <div className="lbrow" key={r.label}>
                <span className="rk">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
                <span className="lbn">{cap(r.label)}</span>
                <span className="lbu">{r.qty}</span>
                <span className="lbp">{inr(r.rev)}</span>
              </div>
            ))
          )}
          {seeded && tab === "wk" && <div className="muted" style={{ marginTop: 8, fontSize: 11.5 }}>Showing {period} sales (imported) until live orders build up.</div>}
        </div>

        <div className="card cream">
          <div className="eyebrow dark">Demand you&apos;re missing</div>
          {gaps.length === 0 ? <div className="muted dark">Nothing missing — guests found what they wanted.</div> : gaps.slice(0, 6).map((g) => (
            <Bar key={g.label} label={g.label} val={g.count} max={gaps[0].count} tone="warn" />
          ))}
        </div>

        <div className="card cream">
          <div className="eyebrow dark">Most-loved flavours</div>
          {flavors.length === 0 ? <div className="muted dark">No flavour signals yet.</div> : flavors.slice(0, 6).map((f) => (
            <Bar key={f.label} label={f.label} val={f.count} max={flavors[0].count} tone="good" />
          ))}
        </div>

        {trend.some((t) => t.revenue > 0) && (
          <div className="card glass">
            <div className="eyebrow">Revenue trend</div>
            <div className="trend">
              {trend.map((t, i) => {
                const max = Math.max(1, ...trend.map((x) => x.revenue));
                return (
                  <div className="tc" key={i} title={`${t.day}: ${inr(t.revenue)}`}>
                    <div className="tb" style={{ height: Math.max(3, Math.round((t.revenue / max) * 80)) }} />
                    <span>{t.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        <div className="foot"><div className="m serif">Bon Bon</div><div className="s">Butter Crafted Ice Creams</div></div>
      </div>
    </div>
  );
}

function Kpi({ n, l, warn }: { n: string; l: string; warn?: boolean }) {
  return (
    <div className="kpi">
      <div className="n" style={warn ? { color: "#f0889f" } : undefined}>{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

function Bar({ label, val, max, tone }: { label: string; val: number; max: number; tone: "warn" | "good" }) {
  const pct = Math.max(8, Math.round((val / max) * 100));
  const col = tone === "warn" ? "#7c1e30" : "#1d9e55";
  const bg = tone === "warn" ? "rgba(124,30,48,.1)" : "rgba(29,158,85,.1)";
  return (
    <div className="hbar">
      <div className="tk" style={{ background: bg }}>
        <div className="fl" style={{ width: `${pct}%`, background: tone === "warn" ? "rgba(124,30,48,.22)" : "rgba(29,158,85,.2)" }} />
        <span className="nm">{cap(label)}</span>
      </div>
      <span className="vv" style={{ color: col }}>{val}×</span>
    </div>
  );
}

const CSS = `
.aim{border-radius:20px;overflow:hidden;color:#f6ece9;margin-bottom:20px;
  font-family:-apple-system,Segoe UI,Roboto,system-ui,sans-serif;
  background:linear-gradient(180deg,rgba(18,8,6,.74),rgba(18,8,6,.84)),url('/wood_web.jpg') center/cover;
  box-shadow:0 14px 34px rgba(0,0,0,.3)}
.aim .serif{font-family:"Cormorant Garamond",Georgia,serif}
.aim .wrap{padding:18px}
.aim .phead-row{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.aim .logo{width:64px;filter:drop-shadow(0 0 8px rgba(255,255,255,.4)) drop-shadow(0 2px 6px rgba(0,0,0,.5))}
.aim .pttl{font-size:18px;font-weight:800}
.aim .psub{font-size:11.5px;color:#d9c3bd;margin-top:1px}
.aim .card{border-radius:18px;padding:18px;margin-bottom:12px;position:relative;overflow:hidden;box-shadow:0 10px 26px rgba(0,0,0,.28)}
.aim .eyebrow{font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#e9cf94}
.aim .eyebrow.dark{color:#7c1e30}.aim .eyebrow.gdark{color:#5c3d0d}.aim .eyebrow.light{color:#eaf3ff}
.aim .sample{font-size:9px;font-weight:800;letter-spacing:.5px;color:#3a2708;background:#e9cf94;border-radius:6px;padding:2px 6px;margin-left:6px;vertical-align:2px}
.aim .say{font-size:13.5px;line-height:1.5;opacity:.95;margin-top:5px}
.aim .say.dark{color:#6c4b50;opacity:.85}
.aim .muted{color:#c9b3ad;font-size:13px;padding:6px 0}.aim .muted.dark{color:#8a6b6f}
.aim .maroon{background:linear-gradient(155deg,#8f2740,#5e1526)}
.aim .cream{background:linear-gradient(155deg,#fbf3ef,#f0e2dc);color:#2a0f14}
.aim .gold{background:linear-gradient(155deg,#eccd7f,#c99a3a);color:#3a2708}
.aim .glass{background:linear-gradient(155deg,rgba(38,14,18,.82),rgba(20,8,10,.86));border:1px solid rgba(233,207,148,.22)}
.aim .sky{background:linear-gradient(155deg,#4a86c4,#2b5a8f);color:#f2f7fc}
.aim .read{font-size:19px;line-height:1.55;margin-top:10px}
.aim .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
@media(max-width:560px){.aim .kpis{grid-template-columns:repeat(2,1fr)}}
.aim .kpi{background:rgba(38,20,24,.72);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 13px}
.aim .kpi .n{font-size:21px;font-weight:800}.aim .kpi .l{font-size:10.5px;color:#c9b3ad;margin-top:3px}
.aim .lbhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.aim .lbtabs{display:flex;gap:4px;background:rgba(0,0,0,.28);border-radius:11px;padding:3px}
.aim .lbtabs button{border:0;background:transparent;color:#c9b3ad;font-weight:700;font-size:11px;padding:5px 11px;border-radius:8px;cursor:pointer}
.aim .lbtabs button.on{background:#e9cf94;color:#3a2708}
.aim .lbcols{display:flex;gap:8px;font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;color:#c9b3ad;opacity:.7;padding:2px 2px 4px}
.aim .lbcols .c1{width:26px;text-align:center}.aim .lbcols .c2{flex:1}.aim .lbcols .c3{width:38px;text-align:right}.aim .lbcols .c4{width:72px;text-align:right}
.aim .lbrow{display:flex;align-items:center;gap:8px;padding:9px 2px;border-top:1px solid rgba(255,255,255,.08)}
.aim .lbrow .rk{width:26px;text-align:center;font-size:15px;font-weight:800}
.aim .lbrow .lbn{flex:1;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aim .lbrow .lbu{width:38px;text-align:right;font-size:12px;color:#c9b3ad}
.aim .lbrow .lbp{width:72px;text-align:right;font-size:13px;font-weight:800;color:#e9cf94}
.aim .hbar{display:flex;align-items:center;gap:10px;margin:7px 0}
.aim .hbar .tk{flex:1;position:relative;height:28px;border-radius:7px;overflow:hidden}
.aim .hbar .fl{position:absolute;inset:0}
.aim .hbar .nm{position:absolute;left:10px;top:0;bottom:0;display:flex;align-items:center;font-size:13px;font-weight:600;color:#2a0f14}
.aim .hbar .vv{font-size:13px;font-weight:800;min-width:38px;text-align:right}
.aim .trend{display:flex;align-items:flex-end;gap:5px;height:98px;margin-top:12px}
.aim .trend .tc{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;justify-content:flex-end}
.aim .trend .tb{width:100%;max-width:26px;border-radius:4px;background:linear-gradient(180deg,#e9cf94,#c99a3a)}
.aim .trend span{font-size:8.5px;color:#c9b3ad}
.aim .lseg{margin:10px 0}
.aim .lhead{display:flex;justify-content:space-between;align-items:baseline}
.aim .ln{font-size:13.5px;font-weight:700;color:#2a0f14}.aim .lp{font-size:12.5px;font-weight:800;color:#7c1e30}
.aim .lt{height:19px;background:rgba(124,30,48,.08);border-radius:6px;overflow:hidden;margin:5px 0 4px}
.aim .lf{display:block;height:100%;border-radius:6px}
.aim .ll{font-size:11.5px;color:#6c4b50;opacity:.85}
.aim .dnote{margin-top:11px;font-size:12.5px;color:#6c4b50;line-height:1.5;background:rgba(124,30,48,.06);border-radius:10px;padding:9px 11px}
.aim .dnote b{color:#7c1e30}
.aim .wtop{display:flex;align-items:center;gap:12px;margin-top:8px}.aim .wtemp{font-size:40px;font-weight:700}.aim .wsun{font-size:34px}
.aim .chips{display:flex;gap:6px;flex-wrap:wrap;margin:11px 0 9px}
.aim .chip{font-size:11.5px;font-weight:600;color:#7c1e30;background:rgba(124,30,48,.09);border:1px solid rgba(124,30,48,.2);border-radius:16px;padding:6px 11px;cursor:pointer}
.aim .inrow{display:flex;gap:7px}
.aim .inrow input{flex:1;border:1.5px solid rgba(124,30,48,.25);border-radius:11px;padding:9px 12px;font-size:13.5px;outline:none;color:#2a0f14;background:#fff}
.aim .inrow button{border:0;background:#7c1e30;color:#fff;font-weight:700;border-radius:11px;padding:0 15px;font-size:13.5px;cursor:pointer}
.aim .res,.aim .pres{margin-top:13px;padding-top:13px;border-top:1px solid rgba(124,30,48,.14)}
.aim .pred{font-size:28px;font-weight:800;color:#7c1e30}.aim .pred small{font-size:14px;font-weight:600;color:#8a6b6f}
.aim .conf{display:inline-block;font-size:10.5px;font-weight:800;text-transform:uppercase;padding:3px 9px;border-radius:7px;margin-left:8px;vertical-align:3px}
.aim .conf.High{background:#e3f5ec;color:#1d9e55}.aim .conf.Medium{background:#fdf0dd;color:#b4801f}
.aim .why{font-size:13px;color:#6c4b50;margin-top:8px;line-height:1.5}
.aim .combo .cb{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid rgba(58,39,8,.16)}
.aim .combo .cb:first-of-type{border-top:0;padding-top:6px}
.aim .combo .ci{flex:1;min-width:0}.aim .combo .cn{font-weight:800;font-size:14px}
.aim .combo .cd{font-size:12px;opacity:.82;margin-top:1px}.aim .combo .cw{font-size:11px;opacity:.66;margin-top:3px}
.aim .combo .cr{text-align:right}.aim .combo .cp{font-weight:800;font-size:16px}
.aim .combo .cpro{margin-top:5px;border:0;background:#3a2708;color:#e9cf94;font-weight:700;font-size:11.5px;border-radius:9px;padding:6px 11px;cursor:pointer}
.aim .phead{font-size:19px;font-weight:700;color:#7c1e30}
.aim .prow{display:flex;gap:8px;font-size:12.5px;margin-top:8px;color:#5a3a3f;line-height:1.4}
.aim .prow .k{font-weight:800;color:#7c1e30;min-width:56px}
.aim .plift{margin-top:9px;font-size:12.5px;font-weight:700;color:#1d9e55}
.aim .live{margin-top:12px;border:0;background:#7c1e30;color:#fff;font-weight:700;font-size:13px;border-radius:11px;padding:10px 16px;cursor:pointer;width:100%}
.aim .toast{position:fixed;left:50%;transform:translateX(-50%);bottom:26px;z-index:60;background:#1d7d4f;color:#fff;font-size:13px;font-weight:600;padding:12px 18px;border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,.4)}
.aim .foot{text-align:center;margin-top:10px}.aim .foot .m{font-size:22px;color:#fff}.aim .foot .s{font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:#d9c3bd;margin-top:2px}
`;
