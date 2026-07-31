"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// The AI Manager — clean, white, professional. Every number is real, from /api/bonbon/insights
// (orders + the chat journal). Includes an ask-anything bar with a mic toggle.

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
        seeded ? `In ${period} you did ${inr(revenue)} — here's what carried it.` : `You did ${inr(revenue)}${orders ? ` across ${orders} orders` : ""} this week.`,
        topSeller ? `${cap(topSeller.label)} is your top seller.` : "",
        topGap ? `${topGap.count} guests asked for ${topGap.label} you don't stock — your biggest gap.` : "",
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <div className="aim">
      <style>{CSS}</style>

      <div className="hero">
        <svg className="spk" viewBox="0 0 260 58" preserveAspectRatio="none">
          <path pathLength={1} d="M0,46 C40,42 60,37 90,35 C130,32 150,23 190,17 C220,12 240,8 260,5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <div className="hrow">
          <span className="eyebrow">Revenue{period ? " · " + period : " · this week"}</span>
        </div>
        <div className="big">{loading ? "…" : inr(revenue)}</div>
        <div className="hmeta">
          <div><b>{seeded ? (week?.itemsSold || 0).toLocaleString("en-IN") : String(orders)}</b>{seeded ? "items sold" : "orders"}</div>
          <div><b>{convos}</b>conversations</div>
          <div><b>{topSeller ? cap(topSeller.label).split(" ")[0] : "—"}</b>top seller</div>
        </div>
      </div>

      <div className="card read-card">
        <div className="head">
          <span className="s">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.9L18.7 9.7 13.8 11.5 12 16.4 10.2 11.5 5.3 9.7 10.2 7.9z" /></svg>
          </span>
          <span className="eyebrow acc">AI Manager</span>
        </div>
        <div className="read">{loading ? "Reading your numbers…" : read}</div>
      </div>

      {unmet > 0 && topGap && (
        <div className="card demand">
          <div className="eyebrow dm">{topGap.count} guests wanted</div>
          <div className="dt">{cap(topGap.label)}</div>
          <div className="ds">…and you didn&apos;t have it. That&apos;s demand walking out of the door.</div>
        </div>
      )}

      <div className="card">
        <div className="rowhead">
          <div className="eyebrow">Points table</div>
          <div className="seg">
            <button className={tab === "d24" ? "on" : ""} onClick={() => setTab("d24")}>Last 24h</button>
            <button className={tab === "wk" ? "on" : ""} onClick={() => setTab("wk")}>This week</button>
          </div>
        </div>
        <div className="cols"><span className="c1">#</span><span className="c2">Dish</span><span className="c3">Sold</span><span className="c4">Sales</span></div>
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
        {seeded && tab === "wk" && <div className="note">Showing {period} sales (imported) until live orders build up.</div>}
      </div>

      <div className="card">
        <div className="eyebrow">Demand you&apos;re missing</div>
        {gaps.length === 0 ? <div className="muted">Nothing missing — guests found what they wanted.</div> : gaps.slice(0, 6).map((g) => (
          <Bar key={g.label} label={g.label} val={g.count} max={gaps[0].count} tone="warn" />
        ))}
      </div>

      <div className="card">
        <div className="eyebrow">Most-loved flavours</div>
        {flavors.length === 0 ? <div className="muted">No flavour signals yet.</div> : flavors.slice(0, 6).map((f) => (
          <Bar key={f.label} label={f.label} val={f.count} max={flavors[0].count} tone="good" />
        ))}
      </div>

      {trend.some((t) => t.revenue > 0) && (
        <div className="card">
          <div className="eyebrow">Revenue trend</div>
          <div className="trend">
            {trend.map((t, i) => {
              const max = Math.max(1, ...trend.map((x) => x.revenue));
              return (
                <div className="tc" key={i} title={`${t.day}: ${inr(t.revenue)}`}>
                  <div className="tb" style={{ height: Math.max(3, Math.round((t.revenue / max) * 78)) }} />
                  <span>{t.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AskBar />
    </div>
  );
}

function Bar({ label, val, max, tone }: { label: string; val: number; max: number; tone: "warn" | "good" }) {
  const pct = Math.max(8, Math.round((val / max) * 100));
  const col = tone === "warn" ? "#a2264a" : "#1d8f52";
  const bg = tone === "warn" ? "#fbedf1" : "#eaf6ef";
  const fill = tone === "warn" ? "#f2cdd8" : "#c9ecd7";
  return (
    <div className="hbar">
      <div className="tk" style={{ background: bg }}>
        <div className="fl" style={{ width: `${pct}%`, background: fill }} />
        <span className="nm">{cap(label)}</span>
      </div>
      <span className="vv" style={{ color: col }}>{val}×</span>
    </div>
  );
}

// ── Ask-anything bar + chat sheet + mic ─────────────────────────────────────────
type Msg = { me: boolean; text: string; typing?: boolean };
function AskBar() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<Msg[]>([]);
  const [val, setVal] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setOpen(true);
    setVal("");
    setBusy(true);
    setLog((l) => [...l, { me: true, text: q }, { me: false, text: "", typing: true }]);
    let answer = "Sorry, I couldn't reach the AI just now.";
    try {
      const r = await fetch("/api/bonbon/manager/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const d = await r.json();
      if (d.answer) answer = d.answer;
    } catch {
      /* keep fallback */
    }
    setLog((l) => {
      const c = [...l];
      const i = c.map((x) => x.typing).lastIndexOf(true);
      if (i >= 0) c[i] = { me: false, text: answer };
      return c;
    });
    setBusy(false);
  }

  function mic() {
    if (busy) return;
    setOpen(true);
    setListening(true);
    setTimeout(() => {
      setListening(false);
      ask("What should I promote this week?");
    }, 1400);
  }

  return (
    <>
      <div className="askbar">
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(val)} onFocus={() => setOpen(true)} placeholder="Ask anything about your shop…" />
        <button className={"mic" + (listening ? " on" : "")} onClick={mic} aria-label="Speak">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
        </button>
      </div>

      {open && (
        <>
          <div className="backdrop" onClick={() => setOpen(false)} />
          <div className="sheet">
            <div className="sheethead">
              <span>Ask your manager</span>
              <button onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="slog" ref={logRef}>
              {log.length === 0 && <div className="hello">Ask me about your sales, what to promote, or what guests keep asking for.</div>}
              {log.map((m, i) =>
                m.typing ? (
                  <div key={i} className="bub ai typing"><span /><span /><span /></div>
                ) : (
                  <div key={i} className={"bub " + (m.me ? "me" : "ai")}>{m.text}</div>
                )
              )}
              {listening && <div className="listening">🎙️ Listening…</div>}
            </div>
            <div className="qs">
              {["What should I promote?", "What am I missing?", "How did June go?"].map((q) => (
                <button key={q} onClick={() => ask(q)}>{q}</button>
              ))}
            </div>
            <div className="sbox">
              <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(val)} placeholder="Type a question…" />
              <button className={"mic" + (listening ? " on" : "")} onClick={mic} aria-label="Speak">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const CSS = `
.aim{color:#1e1418;font-family:-apple-system,Segoe UI,Roboto,system-ui,sans-serif}
.aim .card{background:#fff;border:1px solid #ececf0;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 1px 2px rgba(20,10,15,.04)}
.aim .eyebrow{font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#811226}
.aim .muted{color:#8a8a90;font-size:13px;padding:6px 0}
.aim .note{margin-top:9px;font-size:11.5px;color:#9a8a8e}

/* hero */
.aim .hero{position:relative;overflow:hidden;color:#fff;background:linear-gradient(140deg,#8a1530,#b0324f);
  border-radius:18px;padding:18px;margin-bottom:12px;box-shadow:0 6px 20px rgba(138,21,48,.18)}
.aim .hero .eyebrow{color:rgba(255,255,255,.78)}
.aim .hero .big{font-size:40px;font-weight:800;letter-spacing:-.03em;margin-top:8px;line-height:1;
  font-variant-numeric:tabular-nums}
.aim .hero .hmeta{display:flex;gap:18px;margin-top:15px}
.aim .hero .hmeta div{font-size:11.5px;color:rgba(255,255,255,.8)}
.aim .hero .hmeta b{display:block;font-size:15.5px;font-weight:700;color:#fff;margin-bottom:1px;font-variant-numeric:tabular-nums}
.aim .hero .spk{position:absolute;right:0;bottom:0;width:56%;height:56px;opacity:.5}
.aim .hero .spk path{stroke-dasharray:1;stroke-dashoffset:1;animation:aimdraw 1.2s .3s ease forwards}
@keyframes aimdraw{to{stroke-dashoffset:0}}

.aim .read-card{background:#fbeef1;border-color:#f0d6dd}
.aim .read-card .head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.aim .read-card .s{width:23px;height:23px;border-radius:7px;background:#811226;display:flex;align-items:center;justify-content:center}
.aim .eyebrow.acc{color:#811226}
.aim .read{font-size:15.5px;line-height:1.55;color:#2a121a;font-weight:500}

/* demand */
.aim .demand{background:#241a1e;border:0;color:#fff}
.aim .eyebrow.dm{color:#e08aa0}
.aim .demand .dt{font-size:27px;font-weight:800;letter-spacing:-.02em;margin:7px 0 7px;line-height:1.1}
.aim .demand .ds{font-size:13.5px;color:rgba(255,255,255,.72);line-height:1.5}

.aim .rowhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.aim .seg{display:flex;gap:4px;background:#f3f0f1;border-radius:10px;padding:3px}
.aim .seg button{border:0;background:transparent;color:#8a7a7e;font-weight:700;font-size:11px;padding:5px 11px;border-radius:8px;cursor:pointer}
.aim .seg button.on{background:#811226;color:#fff}
.aim .cols{display:flex;gap:8px;font-size:9.5px;text-transform:uppercase;letter-spacing:.4px;color:#a09498;padding:2px 2px 4px}
.aim .cols .c1{width:24px;text-align:center}.aim .cols .c2{flex:1}.aim .cols .c3{width:38px;text-align:right}.aim .cols .c4{width:72px;text-align:right}
.aim .lbrow{display:flex;align-items:center;gap:8px;padding:9px 2px;border-top:1px solid #f1eef0}
.aim .lbrow .rk{width:24px;text-align:center;font-size:14px;font-weight:800;color:#6b7280}
.aim .lbrow .lbn{flex:1;font-size:13.5px;font-weight:600;color:#1e1418;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aim .lbrow .lbu{width:38px;text-align:right;font-size:12px;color:#8a8a90}
.aim .lbrow .lbp{width:72px;text-align:right;font-size:13px;font-weight:800;color:#811226}

.aim .hbar{display:flex;align-items:center;gap:10px;margin:7px 0}
.aim .hbar .tk{flex:1;position:relative;height:28px;border-radius:7px;overflow:hidden}
.aim .hbar .fl{position:absolute;inset:0}
.aim .hbar .nm{position:absolute;left:10px;top:0;bottom:0;display:flex;align-items:center;font-size:13px;font-weight:600;color:#3a2a30;text-transform:capitalize}
.aim .hbar .vv{font-size:13px;font-weight:800;min-width:36px;text-align:right}

.aim .trend{display:flex;align-items:flex-end;gap:5px;height:96px;margin-top:12px}
.aim .trend .tc{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;justify-content:flex-end}
.aim .trend .tb{width:100%;max-width:26px;border-radius:4px;background:linear-gradient(180deg,#a83048,#811226)}
.aim .trend span{font-size:8.5px;color:#a09498}

/* ask bar */
.aim .askbar{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:40;width:min(432px,92vw);
  display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e6e2e4;border-radius:26px;
  padding:7px 7px 7px 16px;box-shadow:0 8px 26px rgba(20,10,15,.14)}
.aim .askbar input{flex:1;border:0;outline:none;font-size:14px;color:#1e1418;background:transparent;font-family:inherit}
.aim .mic{width:38px;height:38px;flex:0 0 38px;border:0;border-radius:50%;background:#811226;display:flex;align-items:center;justify-content:center;cursor:pointer}
.aim .mic.on{background:#d63b64;animation:mp 1s infinite}
@keyframes mp{0%{box-shadow:0 0 0 0 rgba(214,59,100,.5)}70%{box-shadow:0 0 0 9px rgba(214,59,100,0)}100%{box-shadow:0 0 0 0 rgba(214,59,100,0)}}

.aim .backdrop{position:fixed;inset:0;background:rgba(20,10,15,.32);z-index:45}
.aim .sheet{position:fixed;left:50%;transform:translateX(-50%);bottom:0;z-index:50;width:min(460px,100vw);
  height:72vh;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -8px 30px rgba(20,10,15,.2);
  display:flex;flex-direction:column;padding:14px 15px 15px;animation:up .32s cubic-bezier(.2,.8,.2,1)}
@keyframes up{from{transform:translate(-50%,100%)}to{transform:translate(-50%,0)}}
.aim .sheethead{display:flex;align-items:center;justify-content:space-between;font-weight:800;font-size:15px;color:#1e1418;margin-bottom:10px}
.aim .sheethead button{border:0;background:transparent;font-size:22px;color:#9a8a8e;cursor:pointer;line-height:1}
.aim .slog{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:9px;padding-right:2px}
.aim .hello{color:#8a8a90;font-size:13.5px;padding:6px 2px}
.aim .bub{max-width:86%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.5}
.aim .bub.me{align-self:flex-end;background:#811226;color:#fff;border-bottom-right-radius:5px}
.aim .bub.ai{align-self:flex-start;background:#f4f1f2;color:#1e1418;border-bottom-left-radius:5px}
.aim .bub.typing{display:flex;gap:4px;padding:13px 14px}
.aim .bub.typing span{width:7px;height:7px;border-radius:50%;background:#b9a7ac;animation:td 1s infinite}
.aim .bub.typing span:nth-child(2){animation-delay:.15s}.aim .bub.typing span:nth-child(3){animation-delay:.3s}
@keyframes td{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
.aim .listening{align-self:center;color:#811226;font-size:12.5px;font-weight:600}
.aim .qs{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
.aim .qs button{font-size:11.5px;color:#811226;background:#fff;border:1px solid #f0dbe0;border-radius:16px;padding:6px 11px;cursor:pointer}
.aim .sbox{display:flex;gap:8px;align-items:center}
.aim .sbox input{flex:1;background:#f6f3f4;border:1px solid #eae5e7;border-radius:20px;padding:10px 14px;font-size:13.5px;color:#1e1418;outline:none;font-family:inherit}
`;
