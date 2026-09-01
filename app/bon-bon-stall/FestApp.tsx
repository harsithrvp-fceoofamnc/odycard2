"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FEST_STALLS, type FestItem } from "@/lib/festMenu";

type ComboItem = { id: string; n: string; p: number; stall: string; stallName: string; veg: 0 | 1 };
type Combo = {
  id: string; name: string; desc: string; price: number; original: number;
  stalls: string[]; items: ComboItem[]; endsAt?: string | null;
};
type Msg =
  | { k: "bot"; t: string }
  | { k: "me"; t: string }
  | { k: "typing" }
  | { k: "grid"; items: FestItem[]; emoji: string }
  | { k: "combos"; list: Combo[] }
  | { k: "chips" };

const A = "/fest/";

/* Per-stall palette — same variables the chatbot uses, different values. */
const THEME: Record<string, { blue: string; cream: string; top: string; bot: string; gold: string; onTop: string }> = {
  bonbon: { blue: "#811226", cream: "#f2e0de", top: "#811226", bot: "#5a0c1a", gold: "#b9842b", onTop: "#f3e2c4" },
  kimchi: { blue: "#c8141e", cream: "#fdeff0", top: "#d8323c", bot: "#96101c", gold: "#e8a0a5", onTop: "#ffd7da" },
  dvour:  { blue: "#a87c00", cream: "#f6f6f7", top: "#1d1d1f", bot: "#050505", gold: "#ffc400", onTop: "#c9c9cc" },
};

export default function FestApp() {
  const [phase, setPhase] = useState<"splash" | "intro" | "pick" | "menu">("splash");
  const [stall, setStall] = useState<string | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [mid, setMid] = useState(1);
  const [line, setLine] = useState("");
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/fest/combos").then((r) => (r.ok ? r.json() : { combos: [] }))
      .then((d) => setCombos(d.combos || [])).catch(() => {});
  }, []);

  const type = useCallback((txt: string) => {
    setTyping(true);
    let n = 0;
    const step = () => {
      n++; setLine(txt.slice(0, n));
      if (n >= txt.length) { setTyping(false); return; }
      setTimeout(step, /[.,!?…]/.test(txt[n - 1]) ? 120 : 28);
    };
    step();
  }, []);

  useEffect(() => { const t = setTimeout(() => setPhase("intro"), 2600); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => type("Welcome! 👋 I'm your waiter today."), 1150);
    return () => clearTimeout(t);
  }, [phase, type]);

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

  return (
    <div className="fst">
      <style>{CSS}</style>
      <div id="phone" className={phase === "menu" ? "inmenu" : ""}>

        {/* splash */}
        <div className={"splash" + (phase === "splash" ? " in" : "")}>
          <img src={A + "logo_bonbon.png"} alt="" />
        </div>

        {phase !== "menu" && (
          <div className="dark">
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
                    onClick={() => { if (pos !== "mid") { setMid(i); autoplay(); } else { setStall(s.key); setPhase("menu"); } }}>
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
          </div>
        )}

        {phase === "menu" && stall && (
          <StallChat key={stall} stallKey={stall} combos={combos}
            onBack={() => { setStall(null); setPhase("pick"); }} />
        )}
      </div>
    </div>
  );
}

/* ══════════════ one stall — the chatbot, minus the ask bar ══════════════ */
function StallChat({ stallKey, combos, onBack }: { stallKey: string; combos: Combo[]; onBack: () => void }) {
  const stall = FEST_STALLS.find((s) => s.key === stallKey)!;
  const th = THEME[stallKey];
  const mine = combos.filter((c) => c.stalls.includes(stallKey));

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<FestItem | null>(null);
  const [shutUp, setShutUp] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShutUp(true), 550);
    const t2 = setTimeout(() => {
      setMsgs([{ k: "bot", t: `Hi! 👋 Welcome to ${stall.name} — what are you looking for?` }, { k: "chips" }]);
    }, 1500);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [stall.name]);

  useEffect(() => {
    const el = chatRef.current;
    if (el) setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }), 60);
  }, [msgs]);

  function pickCat(key: string, label: string) {
    if (busy) return;
    setBusy(true);
    setMsgs((m) => [...m.filter((x) => x.k !== "chips"), { k: "me", t: label }, { k: "typing" }]);
    setTimeout(() => {
      setMsgs((m) => {
        const base = m.filter((x) => x.k !== "typing");
        if (key === "__combos") {
          return [...base,
            { k: "bot", t: mine.length ? "Here's what's running right now 🔥" : "No combos running at the moment." },
            { k: "combos", list: mine }, { k: "chips" }];
        }
        const c = stall.categories.find((x) => x.key === key)!;
        const emoji = (c.label.match(/^\S+/) || ["🍽️"])[0];
        return [...base, { k: "bot", t: `Here's everything in ${c.label.replace(/^\S+\s/, "")} 👇` },
          { k: "grid", items: c.items, emoji }, { k: "chips" }];
      });
      setBusy(false);
    }, 620);
  }

  return (
    <div className="stallwrap" style={{
      ["--blue" as string]: th.blue, ["--cream" as string]: th.cream,
      ["--brandtop" as string]: th.top, ["--brandbot" as string]: th.bot,
      ["--gold" as string]: th.gold, ["--onTop" as string]: th.onTop,
    }}>
      {/* shutter rolls up into the shop */}
      <div className={"shutter s-" + stallKey + (shutUp ? " up" : "")}>
        {stallKey === "bonbon"
          ? <img className="shlogo" src={A + "logo_bonbon.png"} alt="" />
          : <img src={A + `${stallKey}_shutter.png`} alt="" />}
      </div>

      {/* header — same shape as the chatbot's */}
      <header>
        <button className="hback" onClick={onBack} aria-label="Back to menus">‹</button>
        <img className="hlogo" src={A + `logo_${stallKey}.png`} alt="" />
        <div className="htxt">
          <h1>{stall.name}</h1>
          <div className="sub">{stall.tagline}</div>
        </div>
      </header>

      {/* category strip — sits where the language bar does */}
      <div className="langbar">
        {mine.length > 0 && (
          <button className="lang combo" onClick={() => pickCat("__combos", "🔥 Combos")}>🔥 Combos</button>
        )}
        {stall.categories.map((c) => (
          <button key={c.key} className="lang" onClick={() => pickCat(c.key, c.label)}>{c.label}</button>
        ))}
      </div>

      <div id="chat" ref={chatRef}>
        {msgs.map((m, i) => {
          if (m.k === "bot") return <div key={i} className="msg bot">{m.t}</div>;
          if (m.k === "me") return <div key={i} className="msg me">{m.t}</div>;
          if (m.k === "typing") return (
            <div key={i} className="msg bot"><span className="typing">
              <i className="dot" /><i className="dot" /><i className="dot" /></span></div>
          );
          if (m.k === "chips") return (
            <div key={i} className="chips">
              {mine.length > 0 && <button className="chip go" onClick={() => pickCat("__combos", "🔥 Combos")}>🔥 Combos</button>}
              {stall.categories.map((c) => (
                <button key={c.key} className="chip" onClick={() => pickCat(c.key, c.label)}>{c.label}</button>
              ))}
            </div>
          );
          if (m.k === "combos") return (
            <div key={i} className="grid one">
              {m.list.map((c) => <ComboCard key={c.id} c={c} />)}
            </div>
          );
          return (
            <div key={i} className="grid">
              {m.items.map((it) => (
                <div key={it.id} className={"dish" + (it.off ? " off" : "")}>
                  <div className="pic">{m.emoji}</div>
                  <div className="bd">
                    <div className="nm"><span className={it.veg ? "veg" : "non"} />{it.n}</div>
                    {it.tag && <div className="tag">★ {it.tag}</div>}
                    <div className="frow">
                      {it.off ? <span className="soldout">SOLD OUT</span> : <span className="pr">₹{it.p}</span>}
                      {it.d && <button className="infob" onClick={() => setInfo(it)}>ⓘ</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        <div className="wmark">
          <img src={A + `logo_${stallKey}.png`} alt="" />
          <div className="cap">{stall.tagline}</div>
        </div>
      </div>

      {info && (
        <div className="scrim" onClick={() => setInfo(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2><span className={info.veg ? "veg" : "non"} />{info.n}</h2>
            {info.tag && <div className="tag">★ {info.tag}</div>}
            <p className="sd">{info.d}</p>
            <div className="sp">₹{info.p}</div>
            <button className="close" onClick={() => setInfo(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComboCard({ c }: { c: Combo }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!c.endsAt) return;
    const tick = () => {
      const ms = Date.parse(c.endsAt!) - Date.now();
      if (ms <= 0) return setLeft("ended");
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      setLeft(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [c.endsAt]);
  const save = c.original - c.price;
  return (
    <div className="combo">
      <div className="chead">
        <div className="cn">{c.name}</div>
        {left && <div className="ctimer">⏱ {left}</div>}
      </div>
      {c.desc && <div className="cd">{c.desc}</div>}
      <div className="clist">
        {c.items.map((i) => (
          <div key={i.id} className="ci">
            <span className={"dot2 d-" + i.stall} /><span className="cin">{i.n}</span>
            <span className="cis">{i.stallName}</span>
          </div>
        ))}
      </div>
      <div className="cfoot">
        <div><span className="cprice">₹{c.price}</span>{save > 0 && <span className="corig">₹{c.original}</span>}</div>
        {save > 0 && <div className="csave">Save ₹{save}</div>}
      </div>
    </div>
  );
}

const CSS = `
.fst{--blue:#811226;--ink:#2a1212;--mut:#9a8585;--line:#ecdcdc;--cream:#f2e0de;--gold:#b9842b;
  --card:#fffdfc;--brandtop:#811226;--brandbot:#5a0c1a;--onTop:#f3e2c4;
  position:fixed;inset:0;background:#000;display:flex;justify-content:center;align-items:center;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;overflow:hidden}
.fst *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.fst button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
#phone{width:100%;max-width:520px;height:100dvh;background:#000;overflow:hidden;display:flex;
  flex-direction:column;position:relative;box-shadow:0 0 44px rgba(0,0,0,.5)}
#phone.inmenu{background:var(--cream)}

/* splash */
.splash{position:absolute;inset:0;z-index:60;background:#000;display:flex;align-items:center;
  justify-content:center;opacity:0;pointer-events:none;transition:opacity 1.5s ease}
.splash.in{opacity:1}
.splash img{width:82%;max-width:330px;filter:drop-shadow(0 0 40px rgba(255,120,160,.35))}

/* ── dark intro + picker ── */
.dark{position:absolute;inset:0;overflow:hidden}
.hero{position:absolute;left:0;bottom:0;z-index:30;height:70vh;max-height:540px;transform:translateX(-120%);
  opacity:0;transition:transform 1.7s cubic-bezier(.33,.02,.2,1),opacity .9s ease}
.hero.in{transform:translateX(-6%);opacity:1}
.hero.out{transform:translateX(-120%);opacity:0;transition:transform 1.2s cubic-bezier(.5,0,.75,.1),opacity .8s}
.hero img{height:100%;width:auto;display:block;filter:drop-shadow(0 0 50px rgba(255,190,140,.18))}
.herobub{position:absolute;left:44%;bottom:58%;right:16px;z-index:32;opacity:0;
  transform:translateY(12px) scale(.95);transition:opacity .7s ease,transform .95s cubic-bezier(.33,.02,.2,1)}
.herobub.in{opacity:1;transform:none}
.bubble{position:relative;background:#fff;border-radius:20px;padding:15px 17px;box-shadow:0 18px 46px rgba(0,0,0,.55)}
.bubble:after{content:"";position:absolute;left:-11px;bottom:20px;border:11px solid transparent;
  border-right-color:#fff;border-left:0}
.bubble .t{font-size:15px;line-height:1.5;color:#1c1a1f;font-weight:500;min-height:22px}
.cur{display:inline-block;width:2px;height:14px;background:#8a1530;vertical-align:-2px;margin-left:2px;
  animation:blink .75s steps(2) infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.taphint{position:absolute;left:0;right:0;bottom:24px;z-index:40;text-align:center;font-size:9.5px;
  font-weight:800;letter-spacing:.3em;color:#5a5058;animation:pulse 2.1s infinite}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
.tapzone{position:absolute;inset:0;z-index:28}
.craving{position:absolute;top:0;left:0;right:0;z-index:20;text-align:center;padding:30px 22px 0;
  transform:translateY(-150%);opacity:0;transition:transform 1.5s cubic-bezier(.33,.02,.2,1),opacity 1s ease}
.craving.in{transform:none;opacity:1}
.craving h1{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.2}
.craving .g{background:linear-gradient(95deg,#ff4d8d,#c14ff0 55%,#7c5cff);-webkit-background-clip:text;
  background-clip:text;-webkit-text-fill-color:transparent;font-size:30px;display:block}
.big{position:absolute;left:50%;bottom:0;z-index:5;height:80vh;max-height:660px;
  transform:translateX(-50%) translateY(30%);opacity:0;
  transition:transform 1.8s cubic-bezier(.33,.02,.2,1),opacity 1.2s ease}
.big.in{transform:translateX(-50%) translateY(4%);opacity:1}
.big img{height:100%;width:auto;display:block;filter:drop-shadow(0 0 60px rgba(255,190,140,.16))}
.bigglow{position:absolute;left:50%;bottom:-6%;width:420px;height:420px;transform:translateX(-50%);z-index:4;
  background:radial-gradient(circle,rgba(255,150,190,.12),transparent 68%);opacity:0;transition:opacity 1.6s ease}
.bigglow.in{opacity:1}
.stage{position:absolute;left:0;right:0;bottom:10%;height:360px;z-index:12;perspective:1200px}
.scard{position:absolute;left:50%;top:0;width:238px;height:352px;margin-left:-119px;border-radius:26px;
  overflow:hidden;opacity:0;display:block;
  transition:transform .62s cubic-bezier(.25,.9,.3,1),opacity .55s ease,filter .55s ease}
.stage.up .scard{opacity:1}
.scard.mid{transform:translateX(0) scale(1);z-index:6}
.scard.left{transform:translateX(-140px) scale(.6);z-index:3;filter:brightness(.5);opacity:.8}
.scard.right{transform:translateX(140px) scale(.6);z-index:3;filter:brightness(.5);opacity:.8}
.stage:not(.up) .scard{transform:translateY(130%) scale(.6);opacity:0}
.slg{position:absolute;left:8%;right:8%;top:12%;width:84%;height:26%;object-fit:contain;z-index:3;
  filter:drop-shadow(0 3px 12px rgba(0,0,0,.5))}
.stag{position:absolute;left:0;right:0;top:46%;z-index:3;font-size:8.5px;letter-spacing:.24em;
  font-weight:700;text-align:center}
.scta{position:absolute;left:14px;right:14px;bottom:14px;z-index:3;border-radius:28px;padding:11px;
  font-size:12.5px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:7px}
.arw{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;line-height:0;padding-bottom:2px}
.edge{position:absolute;inset:0;z-index:5;border-radius:26px;pointer-events:none;
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

/* ══════════ the chatbot ══════════ */
.stallwrap{position:absolute;inset:0;background:var(--cream);display:flex;flex-direction:column;overflow:hidden}
.shutter{position:absolute;inset:0;z-index:50;background:#141414;overflow:hidden;display:flex;
  align-items:center;justify-content:center;transition:transform 1.5s cubic-bezier(.72,.02,.28,1)}
.shutter.up{transform:translateY(-101%)}
.shutter img{width:100%;height:100%;object-fit:cover}
.shutter .shlogo{width:62%;height:auto;object-fit:contain}
.s-bonbon{background:repeating-linear-gradient(180deg,#4a2a17 0 13px,#5a3520 13px 14px,#38200f 14px 15px)}

.stallwrap header{background:linear-gradient(135deg,var(--brandtop),var(--brandbot));color:#fff;
  padding:11px 14px 10px;display:flex;align-items:center;gap:10px;border-bottom:2px solid var(--gold);
  position:relative;z-index:2;box-shadow:0 2px 14px rgba(0,0,0,.3)}
.hback{background:rgba(255,255,255,.18);color:#fff;width:32px;height:32px;border-radius:9px;font-size:22px;
  line-height:0;padding-bottom:3px;flex:0 0 auto;display:flex;align-items:center;justify-content:center}
.hlogo{height:32px;width:auto;max-width:76px;object-fit:contain;flex:0 0 auto}
.htxt{min-width:0}
.stallwrap h1{font-size:16.5px;font-weight:700;letter-spacing:.2px;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.stallwrap .sub{font-size:9px;letter-spacing:.14em;margin-top:2px;color:var(--onTop)}

.langbar{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:var(--brandbot);
  scrollbar-width:none;flex:0 0 auto}
.langbar::-webkit-scrollbar{display:none}
.lang{flex:0 0 auto;font-size:13px;color:#fff;background:rgba(255,255,255,.14);padding:6px 12px;
  border-radius:20px;font-weight:600;white-space:nowrap}
.lang.combo{background:#ff6a2b;color:#fff;font-weight:800}

#chat{flex:1;overflow-y:auto;padding:14px 9px 20px;display:flex;flex-direction:column;gap:10px;
  min-height:0;-webkit-overflow-scrolling:touch}
.msg{max-width:88%;font-size:15px;line-height:1.45;padding:10px 13px;border-radius:15px;
  animation:pop .42s cubic-bezier(.16,1,.3,1) both}
.msg.bot{align-self:flex-start;background:#fff;color:var(--ink);border:1px solid var(--line);
  border-bottom-left-radius:5px}
.msg.me{align-self:flex-end;background:var(--blue);color:#fff;border-bottom-right-radius:5px}
@keyframes pop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
.typing{display:inline-flex;gap:5px;align-items:center}
.typing .dot{width:7px;height:7px;border-radius:50%;background:var(--blue);display:inline-block;
  animation:bob 1.3s ease-in-out infinite}
.typing .dot:nth-child(2){animation-delay:.16s}
.typing .dot:nth-child(3){animation-delay:.32s}
@keyframes bob{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-5px);opacity:1}}

.chips{display:flex;flex-wrap:wrap;gap:7px;align-self:flex-start;max-width:100%}
.chip{font-size:13.5px;background:#fff;border:1.3px solid var(--blue);color:var(--blue);padding:7px 12px;
  border-radius:20px;font-weight:600}
.chip.go{background:#ff6a2b;border-color:#ff6a2b;color:#fff;font-weight:800}

.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-self:stretch;
  animation:pop .42s cubic-bezier(.16,1,.3,1) both}
.grid.one{grid-template-columns:1fr}
.dish{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;
  display:flex;flex-direction:column}
.dish.off{opacity:.55}
.dish .pic{height:104px;background:linear-gradient(135deg,#f3e7e6,#ead9d7);display:flex;align-items:center;
  justify-content:center;font-size:40px}
.dish .bd{padding:10px 11px;display:flex;flex-direction:column;gap:5px;flex:1}
.dish .nm{font-size:14.5px;font-weight:700;color:var(--ink);line-height:1.28;display:flex;gap:7px;
  align-items:flex-start;overflow-wrap:anywhere}
.dish .tag{font-size:11.5px;color:var(--blue);font-weight:700}
.dish .pr{font-size:15.5px;color:var(--blue);font-weight:700}
.soldout{font-size:11px;font-weight:800;color:var(--mut);letter-spacing:.04em}
.frow{display:flex;gap:6px;margin-top:auto;align-items:center;justify-content:space-between}
.infob{border:1.3px solid var(--line);background:#fff;color:var(--blue);font-size:14px;padding:4px 9px;
  border-radius:9px;flex:0 0 auto}
.veg,.non{width:13px;height:13px;flex:0 0 auto;margin-top:2px;border:1.6px solid #0e7a3c;border-radius:2px;
  position:relative;display:inline-block}
.non{border-color:#c0392b}
.veg:after,.non:after{content:"";position:absolute;inset:2.6px;border-radius:50%;background:#0e7a3c}
.non:after{background:#c0392b}

.wmark{align-self:center;text-align:center;margin-top:auto;padding-top:22px;padding-bottom:4px;opacity:.5}
.wmark img{width:120px}
.wmark .cap{font-size:9px;color:var(--mut);letter-spacing:2px;margin-top:7px}

/* combos */
.combo{background:#fff;border:1.5px solid #ffd9c6;border-radius:15px;padding:14px}
.chead{display:flex;align-items:center;gap:9px;justify-content:space-between}
.cn{font-size:15.5px;font-weight:800;color:var(--ink)}
.ctimer{flex:0 0 auto;font-size:10px;font-weight:800;color:#d8410c;background:#fff0e8;padding:5px 9px;border-radius:20px}
.cd{font-size:12px;color:var(--mut);line-height:1.5;margin-top:6px}
.clist{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.ci{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink)}
.cin{flex:1;font-weight:600}
.cis{font-size:9.5px;color:var(--mut)}
.dot2{width:9px;height:9px;border-radius:3px;flex:0 0 auto}
.d-bonbon{background:#811226}.d-kimchi{background:#d8323c}.d-dvour{background:#ffc400}
.cfoot{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;
  border-top:1px dashed var(--line)}
.cprice{font-size:20px;font-weight:800;color:var(--ink)}
.corig{font-size:13px;color:var(--mut);text-decoration:line-through;margin-left:8px}
.csave{font-size:11px;font-weight:800;color:#0e7a3c;background:#e7f6ee;padding:6px 10px;border-radius:20px}

/* info sheet */
.scrim{position:absolute;inset:0;z-index:70;background:rgba(10,8,12,.5);display:flex;align-items:flex-end}
.sheet{background:#fffdf7;width:100%;max-height:92%;overflow-y:auto;border-radius:18px 18px 0 0;
  padding:18px 16px 22px;animation:up .34s cubic-bezier(.2,.85,.25,1) both}
@keyframes up{from{transform:translateY(100%)}to{transform:none}}
.sheet h2{font-size:19px;color:var(--ink);display:flex;gap:9px;align-items:flex-start;line-height:1.3}
.sheet .tag{font-size:11.5px;color:var(--blue);font-weight:700;margin-top:8px}
.sd{font-size:14px;color:var(--mut);line-height:1.6;margin-top:11px}
.sp{font-size:23px;font-weight:800;color:var(--blue);margin-top:12px}
.close{width:100%;margin-top:15px;border-radius:12px;background:var(--blue);color:#fff;padding:13px;
  font-size:14.5px;font-weight:700}
`;
