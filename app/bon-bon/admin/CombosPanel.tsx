"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FEST_STALLS, allFestItems } from "@/lib/festMenu";

type ComboItem = { id: string; n: string; p: number; stall: string; stallName: string };
type Combo = {
  id: string; name: string; desc: string; price: number; original: number; active: boolean;
  stalls: string[]; items: ComboItem[]; startsAt?: string | null; endsAt?: string | null;
};

const STALL_COL: Record<string, string> = { bonbon: "#8a1530", kimchi: "#d8323c", dvour: "#c99400" };
const STALL_NAME: Record<string, string> = { bonbon: "Bon Bon", kimchi: "Kim Chi & Ramen", dvour: "D'VOUR" };

/** Owner-only: build limited-time combos that can mix items from any stall. */
export function CombosPanel() {
  const ALL = useMemo(() => allFestItems(), []);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [endsAt, setEndsAt] = useState("");
  const [q, setQ] = useState("");
  const [stallTab, setStallTab] = useState<string>("dvour");

  const load = useCallback(async () => {
    const r = await fetch("/api/fest/combos?all=1");
    if (r.ok) setCombos((await r.json()).combos || []);
  }, []);
  useEffect(() => {
    let alive = true;
    fetch("/api/fest/combos?all=1")
      .then((r) => (r.ok ? r.json() : { combos: [] }))
      .then((d) => { if (alive) setCombos(d.combos || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // kept in state so render stays pure; ticks once a minute to expire finished combos
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t0 = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, []);

  const original = picked.reduce((t, id) => t + (ALL.find((i) => i.id === id)?.p || 0), 0);
  const save = original - (parseInt(price, 10) || 0);
  const stallsUsed = [...new Set(picked.map((id) => ALL.find((i) => i.id === id)?.stall).filter(Boolean))] as string[];

  const visible = ALL.filter((i) => i.stall === stallTab &&
    (!q || i.n.toLowerCase().includes(q.toLowerCase())));

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }
  function reset() {
    setName(""); setDesc(""); setPrice(""); setPicked([]); setEndsAt(""); setQ(""); setMsg("");
  }
  async function save_() {
    setMsg(""); setBusy(true);
    const r = await fetch("/api/fest/combos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, desc, price, itemIds: picked, endsAt: endsAt || null, active: true }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Could not save");
    reset(); setOpen(false); load();
  }
  async function toggleLive(c: Combo) {
    setCombos((p) => p.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    await fetch("/api/fest/combos", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }) });
  }
  async function remove(c: Combo) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    setCombos((p) => p.filter((x) => x.id !== c.id));
    await fetch("/api/fest/combos?id=" + c.id, { method: "DELETE" });
  }

  return (
    <div className="cmb">
      <style>{CSS}</style>

      <div className="head">
        <div>
          <div className="eyebrow">Limited-time combos</div>
          <div className="sub">Mix items from any stall. The Combos tab appears only in the stalls a combo uses.</div>
        </div>
        <button className="add" onClick={() => setOpen((o) => !o)}>{open ? "Cancel" : "+ New combo"}</button>
      </div>

      {open && (
        <div className="builder">
          <input className="in" placeholder="Combo name — e.g. Ramen + Scoop" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="in" placeholder="Short description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />

          <div className="lbl">Pick items — any stall</div>
          <div className="tabs">
            {FEST_STALLS.map((s) => (
              <button key={s.key} className={"tab" + (stallTab === s.key ? " on" : "")}
                style={stallTab === s.key ? { background: STALL_COL[s.key], borderColor: STALL_COL[s.key] } : {}}
                onClick={() => setStallTab(s.key)}>{s.name}</button>
            ))}
          </div>
          <input className="in search" placeholder="Search this stall…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="picker">
            {visible.map((i) => (
              <button key={i.id} className={"pi" + (picked.includes(i.id) ? " on" : "")} onClick={() => toggle(i.id)}>
                <span className={i.veg ? "veg" : "non"} />
                <span className="pin">{i.n}</span>
                <span className="pip">₹{i.p}</span>
              </button>
            ))}
            {visible.length === 0 && <div className="none">No items match.</div>}
          </div>

          {picked.length > 0 && (
            <div className="chosen">
              <div className="lbl">In this combo ({picked.length})</div>
              {picked.map((id) => {
                const i = ALL.find((x) => x.id === id)!;
                return (
                  <div key={id} className="ch">
                    <span className="dot" style={{ background: STALL_COL[i.stall] }} />
                    <span className="chn">{i.n}</span>
                    <span className="chs">{i.stallName}</span>
                    <span className="chp">₹{i.p}</span>
                    <button className="x" onClick={() => toggle(id)}>✕</button>
                  </div>
                );
              })}
              <div className="willshow">
                Will show in: {stallsUsed.map((s) => (
                  <b key={s} style={{ color: STALL_COL[s] }}>{STALL_NAME[s]}</b>
                )).reduce((a, b, i) => (i ? [...a, <span key={"s" + i}> · </span>, b] : [b]), [] as React.ReactNode[])}
              </div>
            </div>
          )}

          <div className="row2">
            <div>
              <div className="lbl">Combo price</div>
              <input className="in" inputMode="numeric" placeholder="₹" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <div className="lbl">Ends at (optional)</div>
              <input className="in" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          {picked.length > 0 && price && (
            <div className="calc">
              Items add up to <b>₹{original}</b> · combo at <b>₹{price}</b>
              {save > 0 ? <span className="good"> — guests save ₹{save}</span>
                        : <span className="bad"> — that&apos;s not cheaper than buying separately</span>}
            </div>
          )}

          {msg && <div className="err">{msg}</div>}
          <button className="save" disabled={busy} onClick={save_}>{busy ? "Saving…" : "Create combo"}</button>
        </div>
      )}

      {combos.length === 0 && !open && <div className="none2">No combos yet. Create one and it appears in the stalls it uses.</div>}

      {combos.map((c) => {
        const live = c.active && (!c.endsAt || !now || Date.parse(c.endsAt) > now);
        return (
          <div key={c.id} className={"row" + (live ? "" : " dim")}>
            <div className="rl">
              <div className="rn">{c.name} {!live && <span className="paused">{c.active ? "ENDED" : "PAUSED"}</span>}</div>
              <div className="rs">
                {c.items.map((i) => i.n).join(" + ")}
              </div>
              <div className="rstalls">
                {c.stalls.map((s) => <span key={s} className="pill" style={{ background: STALL_COL[s] }}>{STALL_NAME[s]}</span>)}
                {c.endsAt && <span className="until">until {new Date(c.endsAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>}
              </div>
            </div>
            <div className="rr">
              <div className="rp">₹{c.price}</div>
              {c.original > c.price && <div className="ro">₹{c.original}</div>}
              <div className="acts">
                <button onClick={() => toggleLive(c)}>{c.active ? "Pause" : "Resume"}</button>
                <button className="del" onClick={() => remove(c)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const CSS = `
.cmb{background:#fff;border-radius:18px;padding:16px;box-shadow:0 1px 2px rgba(20,20,40,.05),0 6px 18px rgba(20,20,40,.03)}
.cmb .head{display:flex;align-items:flex-start;gap:12px;margin-bottom:13px}
.cmb .eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#8a1530}
.cmb .sub{font-size:11.5px;color:#8a8a90;margin-top:4px;line-height:1.5;max-width:250px}
.cmb .add{margin-left:auto;flex:0 0 auto;background:#8a1530;color:#fff;border:0;border-radius:10px;
  padding:9px 14px;font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit}
.cmb .builder{border:1px solid #eee;border-radius:14px;padding:13px;margin-bottom:14px;background:#fcfcfd}
.cmb .in{width:100%;border:1px solid #e4e4e8;border-radius:10px;padding:10px 12px;font-size:13.5px;
  font-family:inherit;margin-bottom:8px;outline:none;color:#16131a;background:#fff}
.cmb .in:focus{border-color:#8a1530}
.cmb .lbl{font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#7c7c84;margin:10px 2px 7px}
.cmb .tabs{display:flex;gap:6px;margin-bottom:8px}
.cmb .tab{flex:1;border:1.5px solid #e4e4e8;background:#fff;border-radius:9px;padding:8px;font-size:11.5px;
  font-weight:700;color:#40404a;cursor:pointer;font-family:inherit}
.cmb .tab.on{color:#fff}
.cmb .search{margin-bottom:8px}
.cmb .picker{max-height:210px;overflow-y:auto;border:1px solid #eee;border-radius:11px;padding:6px;background:#fff}
.cmb .pi{width:100%;display:flex;align-items:center;gap:9px;padding:9px 10px;border:0;background:none;
  border-radius:8px;cursor:pointer;font-family:inherit;text-align:left}
.cmb .pi:hover{background:#faf7f8}
.cmb .pi.on{background:#fbeef1}
.cmb .pin{flex:1;font-size:12.5px;color:#16131a;font-weight:600}
.cmb .pip{font-size:12.5px;font-weight:800;color:#16131a}
.cmb .none,.cmb .none2{font-size:12.5px;color:#9a9aa1;padding:14px;text-align:center}
.cmb .veg,.cmb .non{width:12px;height:12px;flex:0 0 auto;border:1.5px solid #0e7a3c;border-radius:2px;position:relative}
.cmb .non{border-color:#c0392b}
.cmb .veg:after,.cmb .non:after{content:"";position:absolute;inset:2.4px;border-radius:50%;background:#0e7a3c}
.cmb .non:after{background:#c0392b}
.cmb .chosen{margin-top:6px}
.cmb .ch{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #eee;border-radius:9px;
  padding:8px 10px;margin-bottom:5px}
.cmb .dot{width:9px;height:9px;border-radius:3px;flex:0 0 auto}
.cmb .chn{flex:1;font-size:12.5px;font-weight:600;color:#16131a}
.cmb .chs{font-size:9.5px;color:#a3a2aa}
.cmb .chp{font-size:12.5px;font-weight:800;color:#16131a}
.cmb .x{border:0;background:none;color:#c0392b;font-size:12px;cursor:pointer;padding:0 2px}
.cmb .willshow{font-size:11.5px;color:#7c7c84;margin-top:8px;padding:8px 10px;background:#f7f7f9;border-radius:9px}
.cmb .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cmb .calc{font-size:12px;color:#5c5c66;background:#f7f7f9;border-radius:10px;padding:10px 12px;margin:4px 0 10px;line-height:1.5}
.cmb .good{color:#0e7a3c;font-weight:700}
.cmb .bad{color:#c0392b;font-weight:700}
.cmb .err{font-size:12.5px;color:#c0392b;margin-bottom:8px}
.cmb .save{width:100%;background:#8a1530;color:#fff;border:0;border-radius:12px;padding:13px;
  font-size:14.5px;font-weight:800;cursor:pointer;font-family:inherit}
.cmb .row{display:flex;gap:12px;align-items:flex-start;border-top:1px solid #f0f0f3;padding:13px 2px}
.cmb .row.dim{opacity:.55}
.cmb .rl{flex:1;min-width:0}
.cmb .rn{font-size:14px;font-weight:800;color:#16131a}
.cmb .paused{font-size:9px;font-weight:800;letter-spacing:.06em;color:#8a8a90;background:#f0f0f3;
  padding:3px 7px;border-radius:20px;margin-left:6px;vertical-align:2px}
.cmb .rs{font-size:11.5px;color:#8a8a90;margin-top:4px;line-height:1.5}
.cmb .rstalls{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-top:7px}
.cmb .pill{font-size:9px;font-weight:800;color:#fff;padding:3px 8px;border-radius:20px}
.cmb .until{font-size:9.5px;color:#a3a2aa}
.cmb .rr{flex:0 0 auto;text-align:right}
.cmb .rp{font-size:17px;font-weight:800;color:#16131a}
.cmb .ro{font-size:11px;color:#a3a2aa;text-decoration:line-through}
.cmb .acts{display:flex;gap:6px;margin-top:7px}
.cmb .acts button{border:1px solid #e4e4e8;background:#fff;border-radius:8px;padding:5px 9px;font-size:11px;
  font-weight:700;color:#5c5c66;cursor:pointer;font-family:inherit}
.cmb .acts .del{color:#c0392b;border-color:#f2ccc6}
`;
