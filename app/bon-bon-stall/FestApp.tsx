"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FEST_STALLS, type FestItem } from "@/lib/festMenu";

type ComboItem = { id: string; n: string; p: number; stall: string; stallName: string; veg: 0 | 1 };
type Combo = {
  id: string; name: string; desc: string; price: number; original: number;
  stalls: string[]; items: ComboItem[]; endsAt?: string | null;
};

const A = "/fest/";

/* Per-stall look. Bon Bon keeps the wooden shopfront from the old UI. */
const SKIN: Record<string, {
  bar: string; ink: string; accent: string; onAccent: string; page: string;
  card: string; tagCol: string; shutter: "img" | "css";
}> = {
  bonbon: { bar: "#3d2210", ink: "#fff", accent: "#8a1530", onAccent: "#fff", page: "#fdf3f5",
            card: "#fff", tagCol: "#8a1530", shutter: "css" },
  kimchi: { bar: "#fff", ink: "#1a1412", accent: "#d8323c", onAccent: "#fff", page: "#fdeff0",
            card: "#fff", tagCol: "#d8323c", shutter: "img" },
  dvour:  { bar: "#0e0e0e", ink: "#fff", accent: "#ffc400", onAccent: "#141414", page: "#fff",
            card: "#fff", tagCol: "#c99400", shutter: "img" },
};

export default function FestApp() {
  const [phase, setPhase] = useState<"splash" | "intro" | "pick" | "menu">("splash");
  const [stall, setStall] = useState<string | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [mid, setMid] = useState(1);
  const [line, setLine] = useState("");
  const [typing, setTyping] = useState(false);
  const [shutterUp, setShutterUp] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/fest/combos").then((r) => (r.ok ? r.json() : { combos: [] }))
      .then((d) => setCombos(d.combos || [])).catch(() => {});
  }, []);

  /* ---- typewriter ---- */
  const type = useCallback((txt: string, done?: () => void) => {
    setTyping(true);
    let n = 0;
    const step = () => {
      n++;
      setLine(txt.slice(0, n));
      if (n >= txt.length) { setTyping(false); done?.(); return; }
      setTimeout(step, /[.,!?…]/.test(txt[n - 1]) ? 120 : 28);
    };
    step();
  }, []);

  /* ---- intro sequence ---- */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("intro"), 2600);
    return () => clearTimeout(t1);
  }, []);
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => type("Welcome! 👋 I'm your waiter today."), 1150);
    return () => clearTimeout(t);
  }, [phase, type]);

  /* ---- carousel autoplay ---- */
  const autoplay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setMid((m) => (m + 1) % 3), 5200);
  }, []);
  useEffect(() => {
    if (phase === "pick") autoplay();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [phase, autoplay]);

  function toPick() {
    if (typing) { setLine("Welcome! 👋 I'm your waiter today."); setTyping(false); return; }
    if (phase !== "intro" || !line) return;
    setPhase("pick");
  }
  function openStall(k: string) {
    setStall(k); setShutterUp(false); setPhase("menu");
    setTimeout(() => setShutterUp(true), 550);
  }
  function backToPick() {
    setStall(null); setPhase("pick"); setShutterUp(false);
  }

  const S = stall ? SKIN[stall] : SKIN.bonbon;

  return (
    <div className="fest">
      <style>{CSS}</style>

      {/* ── splash ── */}
      <div className={"splash" + (phase === "splash" ? " in" : "")}>
        <img src={A + "logo_bonbon.png"} alt="" />
      </div>

      {/* ── intro + picker ── */}
      {phase !== "menu" && (
        <>
          <div className={"craving" + (phase === "pick" ? " in" : "")}>
            <h1>What are you<span className="g">in the mood for?</span></h1>
          </div>

          <div className={"bigglow" + (phase === "pick" ? " in" : "")} />
          <div className={"big" + (phase === "pick" ? " in" : "")}>
            <img src={A + "mascot_stand.png"} alt="" />
          </div>

          <div className={"stage" + (phase === "pick" ? " up" : "")}>
            {FEST_STALLS.map((s, i) => {
              const d = (i - mid + 3) % 3;
              const pos = d === 0 ? "mid" : d === 1 ? "right" : "left";
              return (
                <button key={s.key} className={`scard ${pos} k-${s.key}`}
                  onClick={() => { if (pos !== "mid") { setMid(i); autoplay(); } else openStall(s.key); }}>
                  <img className="slg" src={A + `logo_${s.key}.png`} alt="" />
                  <div className="stag">{s.tagline}</div>
                  <div className="scta">Explore {s.name}<span className="arw">›</span></div>
                  <div className="sheen" /><div className="edge" />
                </button>
              );
            })}
          </div>

          <div className={"hero" + (phase === "intro" ? " in" : phase === "pick" ? " out" : "")}>
            <img src={A + "mascot_wave.png"} alt="" />
          </div>
          <div className={"herobub" + (phase === "intro" && line ? " in" : "")} onClick={toPick}>
            <div className="bubble"><div className="t">{line}{typing && <i className="cur" />}</div></div>
          </div>
          {phase === "intro" && !typing && line && <div className="taphint" onClick={toPick}>TAP TO CONTINUE</div>}
          {phase === "intro" && <div className="tapzone" onClick={toPick} />}
        </>
      )}

      {/* ── a stall's menu ── */}
      {phase === "menu" && stall && (
        <StallMenu stallKey={stall} skin={S} combos={combos} shutterUp={shutterUp} onBack={backToPick} />
      )}
    </div>
  );
}

/* ══════════════════════ one stall's menu ══════════════════════ */
function StallMenu({ stallKey, skin, combos, shutterUp, onBack }: {
  stallKey: string; skin: (typeof SKIN)[string]; combos: Combo[]; shutterUp: boolean; onBack: () => void;
}) {
  const stall = FEST_STALLS.find((s) => s.key === stallKey)!;
  const mine = combos.filter((c) => c.stalls.includes(stallKey));
  const cats = stall.categories;
  const [cat, setCat] = useState<string>(mine.length ? "__combos" : cats[0].key);
  const [info, setInfo] = useState<FestItem | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [cat]);

  const shown = cat === "__combos" ? [] : (cats.find((c) => c.key === cat)?.items ?? []);

  return (
    <div className="stall" style={{ ["--acc" as string]: skin.accent, ["--onAcc" as string]: skin.onAccent,
      ["--page" as string]: skin.page, ["--tag" as string]: skin.tagCol }}>

      {/* shutter */}
      <div className={"shutter s-" + stallKey + (shutterUp ? " up" : "")}>
        {skin.shutter === "img"
          ? <img src={A + `${stallKey}_shutter.png`} alt="" />
          : <img className="shlogo" src={A + "logo_bonbon.png"} alt="" />}
      </div>

      {/* header */}
      <div className={"sbar b-" + stallKey}>
        {stallKey === "kimchi" && <img className="klant" src={A + "kimchi_lanterns.png"} alt="" />}
        <button className="back" onClick={onBack} aria-label="Back to menus">‹</button>
        <img className="blogo" src={A + `logo_${stallKey}.png`} alt={stall.name} />
      </div>
      {stallKey === "kimchi"
        ? <div className="awnwrap"><img className="awn" src={A + "kimchi_awning.png"} alt="" /></div>
        : <div className="rule" />}

      {/* items */}
      <div className="sbody" ref={bodyRef}>
        {cat === "__combos" ? (
          mine.length === 0
            ? <div className="empty">No combos running right now.</div>
            : mine.map((c) => <ComboCard key={c.id} c={c} />)
        ) : (
          <>
            <div className="cathead">{cats.find((x) => x.key === cat)?.label}</div>
            {shown.map((it) => (
              <button key={it.id} className={"dish" + (it.off ? " off" : "")} onClick={() => it.d && setInfo(it)}>
                <div className="dl">
                  <div className="dn"><span className={it.veg ? "veg" : "non"} />{it.n}</div>
                  {it.tag && <div className="dtag">★ {it.tag}</div>}
                  {it.d && <div className="dd">{it.d}</div>}
                </div>
                <div className="dr">
                  {it.off ? <span className="soldout">SOLD OUT</span> : <span className="dp">₹{it.p}</span>}
                </div>
              </button>
            ))}
          </>
        )}
        <div style={{ height: 8 }} />
      </div>

      {/* categories */}
      <div className="cats">
        {mine.length > 0 && (
          <button className={"cat combo" + (cat === "__combos" ? " on" : "")} onClick={() => setCat("__combos")}>
            🔥 Combos
          </button>
        )}
        {cats.map((c) => (
          <button key={c.key} className={"cat" + (cat === c.key ? " on" : "")} onClick={() => setCat(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* description sheet */}
      {info && (
        <>
          <div className="scrim2" onClick={() => setInfo(null)} />
          <div className="sheet">
            <div className="grab" />
            <div className="dn big2"><span className={info.veg ? "veg" : "non"} />{info.n}</div>
            {info.tag && <div className="dtag">★ {info.tag}</div>}
            <p className="sd">{info.d}</p>
            <div className="sp">₹{info.p}</div>
            <button className="close" onClick={() => setInfo(null)}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════ combo card ══════════════════════ */
function ComboCard({ c }: { c: Combo }) {
  const [left, setLeft] = useState<string>("");
  useEffect(() => {
    if (!c.endsAt) return;
    const tick = () => {
      const ms = Date.parse(c.endsAt!) - Date.now();
      if (ms <= 0) { setLeft("ended"); return; }
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      setLeft(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [c.endsAt]);
  const save = c.original - c.price;

  return (
    <div className="combo">
      <div className="chead">
        <div className="cn">{c.name}</div>
        {left && <div className="ctimer">⏱ ends in {left}</div>}
      </div>
      {c.desc && <div className="cd">{c.desc}</div>}
      <div className="clist">
        {c.items.map((i) => (
          <div key={i.id} className="ci">
            <span className={"dot d-" + i.stall} />
            <span className="cin">{i.n}</span>
            <span className="cis">{i.stallName}</span>
          </div>
        ))}
      </div>
      <div className="cfoot">
        <div>
          <span className="cprice">₹{c.price}</span>
          {save > 0 && <span className="corig">₹{c.original}</span>}
        </div>
        {save > 0 && <div className="csave">You save ₹{save}</div>}
      </div>
    </div>
  );
}

const CSS = `
.fest{position:fixed;inset:0;background:#000;overflow:hidden;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Inter,"Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
.fest *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.fest button{font-family:inherit;border:0;background:none;cursor:pointer;color:inherit}

/* splash */
.splash{position:absolute;inset:0;z-index:60;background:#000;display:flex;align-items:center;justify-content:center;
  opacity:0;pointer-events:none;transition:opacity 1.5s ease}
.splash.in{opacity:1}
.splash img{width:82%;max-width:340px;filter:drop-shadow(0 0 40px rgba(255,120,160,.35))}

/* intro waiter */
.hero{position:absolute;left:0;bottom:0;z-index:30;height:74vh;max-height:560px;
  transform:translateX(-120%);opacity:0;transition:transform 1.7s cubic-bezier(.33,.02,.2,1),opacity .9s ease}
.hero.in{transform:translateX(-6%);opacity:1}
.hero.out{transform:translateX(-120%);opacity:0;transition:transform 1.2s cubic-bezier(.5,0,.75,.1),opacity .8s}
.hero img{height:100%;width:auto;display:block;filter:drop-shadow(0 0 50px rgba(255,190,140,.18))}
.herobub{position:absolute;left:44%;bottom:60%;right:16px;z-index:32;opacity:0;transform:translateY(12px) scale(.95);
  transition:opacity .7s ease,transform .95s cubic-bezier(.33,.02,.2,1)}
.herobub.in{opacity:1;transform:none}
.bubble{position:relative;background:#fff;border-radius:20px;padding:16px 18px;box-shadow:0 18px 46px rgba(0,0,0,.55)}
.bubble:after{content:"";position:absolute;left:-11px;bottom:20px;border:11px solid transparent;
  border-right-color:#fff;border-left:0}
.bubble .t{font-size:15.5px;line-height:1.5;color:#1c1a1f;font-weight:500;min-height:23px}
.cur{display:inline-block;width:2px;height:14px;background:#8a1530;vertical-align:-2px;margin-left:2px;
  animation:blink .75s steps(2) infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.taphint{position:absolute;left:0;right:0;bottom:26px;z-index:40;text-align:center;font-size:9.5px;font-weight:800;
  letter-spacing:.3em;color:#5a5058;animation:pulse 2.1s infinite}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
.tapzone{position:absolute;inset:0;z-index:28}

/* heading */
.craving{position:absolute;top:0;left:0;right:0;z-index:20;text-align:center;padding:34px 24px 0;
  transform:translateY(-150%);opacity:0;transition:transform 1.5s cubic-bezier(.33,.02,.2,1),opacity 1s ease}
.craving.in{transform:none;opacity:1}
.craving h1{font-size:27px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.2}
.craving .g{background:linear-gradient(95deg,#ff4d8d,#c14ff0 55%,#7c5cff);-webkit-background-clip:text;
  background-clip:text;-webkit-text-fill-color:transparent;font-size:31px;display:block}

/* big waiter */
.big{position:absolute;left:50%;bottom:0;z-index:5;height:84vh;max-height:700px;
  transform:translateX(-50%) translateY(30%);opacity:0;
  transition:transform 1.8s cubic-bezier(.33,.02,.2,1),opacity 1.2s ease}
.big.in{transform:translateX(-50%) translateY(4%);opacity:1}
.big img{height:100%;width:auto;display:block;filter:drop-shadow(0 0 60px rgba(255,190,140,.16))}
.bigglow{position:absolute;left:50%;bottom:-6%;width:420px;height:420px;transform:translateX(-50%);z-index:4;
  background:radial-gradient(circle,rgba(255,150,190,.12),transparent 68%);opacity:0;transition:opacity 1.6s ease}
.bigglow.in{opacity:1}

/* stall cards */
.stage{position:absolute;left:0;right:0;bottom:11%;height:372px;z-index:12;perspective:1200px}
.scard{position:absolute;left:50%;top:0;width:242px;height:364px;margin-left:-121px;border-radius:28px;
  overflow:hidden;opacity:0;display:block;padding:0;
  transition:transform .62s cubic-bezier(.25,.9,.3,1),opacity .55s ease,filter .55s ease}
.stage.up .scard{opacity:1}
.scard.mid{transform:translateX(0) scale(1);z-index:6}
.scard.left{transform:translateX(-142px) scale(.6);z-index:3;filter:brightness(.5);opacity:.8}
.scard.right{transform:translateX(142px) scale(.6);z-index:3;filter:brightness(.5);opacity:.8}
.stage:not(.up) .scard{transform:translateY(130%) scale(.6);opacity:0}
.slg{position:absolute;left:8%;right:8%;top:12%;width:84%;height:26%;object-fit:contain;z-index:3;
  filter:drop-shadow(0 3px 12px rgba(0,0,0,.5))}
.stag{position:absolute;left:0;right:0;top:46%;z-index:3;font-size:8.5px;letter-spacing:.24em;font-weight:700}
.scta{position:absolute;left:14px;right:14px;bottom:14px;z-index:3;border-radius:28px;padding:11px;
  font-size:12.5px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:7px}
.arw{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;line-height:0;padding-bottom:2px}
.edge{position:absolute;inset:0;z-index:5;border-radius:28px;pointer-events:none;
  border:1.5px solid rgba(255,255,255,.5);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.7)}
.sheen{position:absolute;inset:0;z-index:4;pointer-events:none;
  background:linear-gradient(148deg,rgba(255,255,255,.24) 0%,rgba(255,255,255,0) 46%)}
.k-bonbon{background:repeating-linear-gradient(93deg,rgba(0,0,0,.22) 0 1px,transparent 1px 5px),
  linear-gradient(165deg,#7a4a28,#3a1d0d);box-shadow:0 0 32px rgba(255,92,147,.3),0 18px 40px rgba(0,0,0,.75)}
.k-bonbon .stag{color:#eddcaa}
.k-bonbon .scta{background:rgba(138,21,48,.65);border:1.5px solid rgba(255,255,255,.7);color:#fff}
.k-bonbon .arw{background:#fff;color:#8a1530}
.k-kimchi{background:linear-gradient(160deg,#f7f2ea,#e2d6c6);box-shadow:0 0 26px rgba(255,60,70,.3),0 18px 40px rgba(0,0,0,.78)}
.k-kimchi .stag{color:#c8141e}
.k-kimchi .scta{background:rgba(200,20,30,.9);border:1.5px solid rgba(255,255,255,.6);color:#fff}
.k-kimchi .arw{background:#fff;color:#c8141e}
.k-dvour{background:linear-gradient(168deg,#1d1d1f,#050505);box-shadow:0 0 26px rgba(255,176,32,.3),0 18px 40px rgba(0,0,0,.78)}
.k-dvour .stag{color:#ffb020}
.k-dvour .scta{background:rgba(12,12,14,.7);border:1.5px solid rgba(255,176,32,.9);color:#ffc453}
.k-dvour .arw{background:#ffb020;color:#111}

/* ══════ stall menu ══════ */
.stall{position:absolute;inset:0;z-index:40;background:var(--page);display:flex;flex-direction:column;
  max-width:460px;margin:0 auto}
.shutter{position:absolute;inset:0;z-index:50;background:#141414;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  transition:transform 1.5s cubic-bezier(.72,.02,.28,1)}
.shutter.up{transform:translateY(-101%)}
.shutter img{width:100%;height:100%;object-fit:cover}
.shutter .shlogo{width:62%;height:auto;object-fit:contain}
.s-bonbon{background:repeating-linear-gradient(180deg,#4a2a17 0 13px,#5a3520 13px 14px,#38200f 14px 15px)}

.sbar{flex:0 0 auto;position:relative;display:flex;align-items:center;justify-content:center;
  padding:16px 52px;min-height:104px;overflow:hidden}
.b-bonbon{background:repeating-linear-gradient(93deg,rgba(0,0,0,.22) 0 1px,transparent 1px 5px),
  repeating-linear-gradient(88deg,rgba(255,255,255,.04) 0 2px,transparent 2px 12px),
  linear-gradient(165deg,#6d4023,#3a1d0d)}
.b-kimchi{background:url('/fest/kimchi_board.png') center/cover}
.b-dvour{background:#0e0e0e;
  background-image:repeating-linear-gradient(70deg,rgba(255,255,255,.025) 0 2px,transparent 2px 26px)}
.blogo{max-width:62%;max-height:66px;object-fit:contain;position:relative;z-index:3}
.klant{position:absolute;top:0;left:0;width:100%;z-index:2;pointer-events:none}
.back{position:absolute;left:10px;top:50%;margin-top:-17px;z-index:6;width:34px;height:34px;border-radius:50%;
  background:rgba(255,255,255,.9);color:#1a1a1a;font-size:23px;line-height:0;padding-bottom:4px;
  display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.rule{flex:0 0 auto;height:3px;background:var(--acc)}
.awnwrap{flex:0 0 auto;overflow:hidden;line-height:0;margin-top:-2px}
.awn{width:126%;margin-left:-13%;display:block;filter:drop-shadow(0 7px 11px rgba(140,20,25,.26))}

.sbody{flex:1;overflow-y:auto;padding:13px 13px 4px;scrollbar-width:none}
.sbody::-webkit-scrollbar{display:none}
.cathead{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8d8a92;
  margin:2px 2px 10px}
.dish{width:100%;text-align:left;display:flex;gap:12px;align-items:flex-start;background:#fff;border-radius:15px;
  padding:13px 14px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:transform .15s}
.dish:active{transform:scale(.985)}
.dish.off{opacity:.5}
.dl{flex:1;min-width:0}
.dn{display:flex;gap:8px;align-items:flex-start;font-size:14px;font-weight:700;color:#16151a;line-height:1.35}
.dn.big2{font-size:19px;letter-spacing:-.02em}
.veg,.non{width:13px;height:13px;flex:0 0 auto;margin-top:3px;border:1.6px solid #0e7a3c;border-radius:2px;position:relative}
.non{border-color:#c0392b}
.veg:after,.non:after{content:"";position:absolute;inset:2.6px;border-radius:50%;background:#0e7a3c}
.non:after{background:#c0392b}
.dtag{font-size:10px;font-weight:800;letter-spacing:.05em;color:var(--tag);margin-top:6px}
.dd{font-size:11.5px;color:#8b8a92;line-height:1.5;margin-top:6px}
.dr{flex:0 0 auto;text-align:right}
.dp{font-size:15.5px;font-weight:800;color:#16151a}
.soldout{font-size:9.5px;font-weight:800;color:#9a9aa1;letter-spacing:.04em}
.empty{background:#fff;border-radius:15px;padding:26px;text-align:center;color:#9a9aa1;font-size:13.5px}

.cats{flex:0 0 auto;display:flex;gap:7px;overflow-x:auto;padding:11px 12px calc(13px + env(safe-area-inset-bottom));
  background:rgba(255,255,255,.96);border-top:1px solid rgba(0,0,0,.07);scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.cat{flex:0 0 auto;border:1.5px solid rgba(0,0,0,.14);background:#fff;border-radius:12px;padding:9px 14px;
  font-size:12.5px;font-weight:700;color:#2a2930;white-space:nowrap;transition:.16s}
.cat:active{transform:scale(.95)}
.cat.on{background:var(--acc);border-color:var(--acc);color:var(--onAcc)}
.cat.combo{border-color:#ff6a2b;color:#d8410c}
.cat.combo.on{background:#ff6a2b;border-color:#ff6a2b;color:#fff}

/* combos */
.combo{background:#fff;border-radius:17px;padding:15px;margin-bottom:10px;
  box-shadow:0 1px 3px rgba(0,0,0,.06);border:1.5px solid #ffd9c6}
.chead{display:flex;align-items:center;gap:9px;justify-content:space-between}
.cn{font-size:16px;font-weight:800;color:#16151a;letter-spacing:-.01em}
.ctimer{flex:0 0 auto;font-size:10px;font-weight:800;color:#d8410c;background:#fff0e8;padding:5px 9px;border-radius:20px}
.cd{font-size:12px;color:#8b8a92;line-height:1.5;margin-top:6px}
.clist{margin-top:11px;display:flex;flex-direction:column;gap:6px}
.ci{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#2a2930}
.cin{flex:1;font-weight:600}
.cis{font-size:9.5px;color:#a3a2aa;letter-spacing:.03em}
.dot{width:9px;height:9px;border-radius:3px;flex:0 0 auto}
.d-bonbon{background:#8a1530}.d-kimchi{background:#d8323c}.d-dvour{background:#ffc400}
.cfoot{display:flex;align-items:center;justify-content:space-between;margin-top:13px;padding-top:11px;
  border-top:1px dashed #e6e4ea}
.cprice{font-size:21px;font-weight:800;color:#16151a}
.corig{font-size:13px;color:#a3a2aa;text-decoration:line-through;margin-left:8px}
.csave{font-size:11px;font-weight:800;color:#0e7a3c;background:#e7f6ee;padding:6px 10px;border-radius:20px}

/* info sheet */
.scrim2{position:absolute;inset:0;z-index:70;background:rgba(10,8,12,.5);backdrop-filter:blur(3px)}
.sheet{position:absolute;left:0;right:0;bottom:0;z-index:71;background:#fff;border-radius:22px 22px 0 0;
  padding:10px 18px calc(20px + env(safe-area-inset-bottom));max-width:460px;margin:0 auto;
  animation:up .34s cubic-bezier(.2,.85,.25,1) both}
@keyframes up{from{transform:translateY(100%)}to{transform:none}}
.grab{width:38px;height:4px;border-radius:4px;background:#d8d6dd;margin:0 auto 15px}
.sd{font-size:14px;color:#6f6e77;line-height:1.6;margin-top:11px}
.sp{font-size:24px;font-weight:800;color:#16151a;margin-top:13px}
.close{width:100%;margin-top:15px;border-radius:13px;background:#16151a;color:#fff;padding:13px;
  font-size:14.5px;font-weight:700}
`;
