"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/ga";

// odysra.com/bon-bon-stall — VIT Chennai food stall.
// Intro (splash → waiter → pick a stall), then that stall's menu, which is the REAL
// Bon Bon chatbot re-skinned by scripts/build_fest.js and served in an iframe.

// logo is explicit rather than derived from the key: Kim Chi's mark was redrawn in white
// and lives outside /fest, and the card and the menu header must not drift apart.
const STALLS = [
  { key: "dvour",  name: "D'VOUR",          pic: "/dvour_burger.png", logo: "/fest/logo_dvour.png" },
  { key: "bonbon", name: "Bon Bon",         pic: "/bon_bon_scoop.png", logo: "/fest/logo_bonbon.png" },
  { key: "kimchi", name: "Kim Chi & Ramen", pic: "/kimchi_ramen.png", logo: "/kimchi_new_logo.png" },
];
const V = 36; // bump to bust the iframe cache after a rebuild

export default function FestApp() {
  const [phase, setPhase] = useState<"splash" | "intro" | "pick">("splash");
  const [open, setOpen] = useState<string | null>(null);
  const [mid, setMid] = useState(1);
  const [shown, setShown] = useState(false);
  // The stall cards wait for the waiter: he rises from the bottom first, and only once he
  // has settled do the three menu blocks come up behind him.
  const [cardsUp, setCardsUp] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { const t = setTimeout(() => setPhase("intro"), 2600); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => setShown(true), 1150);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (phase !== "pick") return;
    const t = setTimeout(() => setCardsUp(true), 1050);
    return () => clearTimeout(t);
  }, [phase]);

  const autoplay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setMid((m) => (m + 1) % 3), 5200);
  }, []);
  useEffect(() => {
    if (phase === "pick" && !open) autoplay();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [phase, open, autoplay]);

  // Swipe the carousel. The cards are <button>s, so a drag across them was being read as a
  // tap and nothing moved — these live on the stage wrapper and only act past a 45px
  // threshold, which leaves an ordinary tap on the centre card working as before.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false); // so the click that ends a swipe doesn't also open the stall
  const onDown = (x: number, y: number) => { swipe.current = { x, y }; };
  const onUp = (x: number, y: number) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = x - s.x;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(y - s.y)) return; // a tap, or a scroll
    track("stall_swipe", { direction: dx < 0 ? "next" : "prev" });
    setMid((m) => (m + (dx < 0 ? 1 : 2)) % 3);
    autoplay();
    swiped.current = true;
    setTimeout(() => { swiped.current = false; }, 0);
  };

  // the stall pages post back when the customer taps their back button
  useEffect(() => {
    const h = (e: MessageEvent) => { if (e.data === "fest:back") { track("back_to_menus", { from: "page" }); setOpen(null); } };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, []);

  return (
    <div className="fst">
      <style>{CSS}</style>
      <div id="phone">

        <div className={"splash" + (phase === "splash" ? " in" : "")}>
          <img src="/logo_web.png" alt="" />
        </div>

        <div className={"craving" + (phase === "pick" ? " in" : "")}>
          <h1>What are you<span className="g">in the mood for?</span></h1>
        </div>

        <div className={"bigglow" + (phase === "pick" ? " in" : "")} />
        <div className={"big" + (phase === "pick" ? " in" : "")}>
          <img src="/fest/mascot_stand.png" alt="" />
        </div>

        <div className={"stage" + (cardsUp ? " up" : "")}
          onTouchStart={(e) => onDown(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={(e) => onUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
          onPointerDown={(e) => { if (e.pointerType === "mouse") onDown(e.clientX, e.clientY); }}
          onPointerUp={(e) => { if (e.pointerType === "mouse") onUp(e.clientX, e.clientY); }}>
          {STALLS.map((s, i) => {
            const d = (i - mid + 3) % 3;
            const pos = d === 0 ? "mid" : d === 1 ? "right" : "left";
            return (
              <button key={s.key} className={`scard ${pos} k-${s.key}`}
                onClick={() => {
                  if (swiped.current) return;
                  if (pos !== "mid") { track("stall_card_tap", { stall: s.key }); setMid(i); autoplay(); return; }
                  track("select_content", { content_type: "stall", item_id: s.key });
                  track("menu_view", { stall: s.key, stall_name: s.name });
                  setOpen(s.key);
                }}>
                <img className="sbg" src={s.pic} alt="" />
                <div className="sveil" />
                <img className="slg" src={s.logo} alt="" />
                <div className="scta">Explore {s.name}<span className="arw">›</span></div>
                <div className="sheen" /><div className="edge" />
              </button>
            );
          })}
        </div>

        <div className={"hero" + (phase === "intro" ? " in" : phase === "pick" ? " out" : "")}>
          <img src="/fest/mascot_wave.png" alt="" />
        </div>
        <div className={"herobub" + (phase === "intro" && shown ? " in" : "")}>
          <div className="hline">Welcome!<span className="g">I&apos;m your waiter today.</span></div>
        </div>
        {phase === "intro" && shown && <div className="taphint">TAP TO CONTINUE</div>}
        {phase === "intro" && <div className="tapzone" onClick={() => { if (!shown) return; track("intro_continue"); setPhase("pick"); }} />}

        {open && (
          <div className="stallframe">
            <iframe src={`/fest/${open}/index.html?v=${V}`} title="Menu" />
            <button className={"fback fb-" + open} onClick={() => { track("back_to_menus", { from: "button", stall: open }); setOpen(null); }} aria-label="Back to menus">‹</button>
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.fst{position:fixed;inset:0;background:#000;display:flex;justify-content:center;align-items:center;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;overflow:hidden}
.fst *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.fst button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
#phone{width:100%;max-width:520px;height:100dvh;background:#000;overflow:hidden;position:relative;
  box-shadow:0 0 44px rgba(0,0,0,.5)}

.splash{position:absolute;inset:0;z-index:60;background:#000;display:flex;align-items:center;
  justify-content:center;opacity:0;pointer-events:none;transition:opacity 1.5s ease}
.splash.in{opacity:1}
.splash img{width:80%;max-width:330px;filter:drop-shadow(0 0 40px rgba(255,120,160,.35))}

.hero{position:absolute;left:0;bottom:0;z-index:30;height:84vh;max-height:680px;transform:translateX(-120%);
  opacity:0;transition:transform 1.7s cubic-bezier(.33,.02,.2,1),opacity .9s ease}
.hero.in{transform:translateX(-6%);opacity:1}
.hero.out{transform:translateX(-120%);opacity:0;transition:transform 1.2s cubic-bezier(.5,0,.75,.1),opacity .8s}
.hero img{height:100%;width:auto;display:block;filter:drop-shadow(0 0 50px rgba(255,190,140,.18))}
/* sits beside his head, not his shoulder */
.herobub{position:absolute;left:44%;bottom:70%;right:16px;z-index:32;opacity:0;
  transform:translateY(12px) scale(.95);transition:opacity .7s ease,transform .95s cubic-bezier(.33,.02,.2,1)}
.herobub.in{opacity:1;transform:none}
/* Set exactly like "What are you in the mood for?" — same sizes, same gradient — so the
   two intro beats read as one voice rather than two designs. */
.hline{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.2;
  text-shadow:0 2px 22px rgba(0,0,0,.75)}
.hline .g{background:linear-gradient(95deg,#ff4d8d,#c14ff0 55%,#7c5cff);-webkit-background-clip:text;
  background-clip:text;-webkit-text-fill-color:transparent;font-size:30px;display:block}
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

.stage{position:absolute;left:0;right:0;bottom:10%;height:360px;z-index:12;perspective:1200px;
  touch-action:pan-y}
.scard{position:absolute;left:50%;top:0;width:238px;height:352px;margin-left:-119px;border-radius:26px;
  overflow:hidden;opacity:0;display:block;
  transition:transform .62s cubic-bezier(.25,.9,.3,1),opacity .55s ease,filter .55s ease}
.stage.up .scard{opacity:1}
.scard.mid{transform:translateX(0) scale(1);z-index:6}
.scard.left{transform:translateX(-140px) scale(.6);z-index:3;filter:brightness(.5);opacity:.8}
.scard.right{transform:translateX(140px) scale(.6);z-index:3;filter:brightness(.5);opacity:.8}
.stage:not(.up) .scard{transform:translateY(130%) scale(.6);opacity:0}
.sbg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
.sveil{position:absolute;inset:0;z-index:1;
  background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.08) 36%,rgba(0,0,0,.15) 58%,rgba(0,0,0,.8) 100%)}
.slg{position:absolute;left:8%;right:8%;top:8%;width:84%;height:24%;object-fit:contain;z-index:3;
  filter:drop-shadow(0 3px 12px rgba(0,0,0,.7))}
/* The card keeps its rim and gloss — only the "Explore" pill changed to frosted glass. */
.scta{position:absolute;left:14px;right:14px;bottom:14px;z-index:3;border-radius:28px;padding:12px 8px;
  font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;
  white-space:nowrap;color:#fff;border:0;background:rgba(255,255,255,.17);
  -webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3)}
.arw{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;line-height:0;padding-bottom:2px;flex:0 0 auto;
  background:rgba(255,255,255,.92);color:#15131a}
.edge{position:absolute;inset:0;z-index:5;border-radius:26px;pointer-events:none;
  border:1.5px solid rgba(255,255,255,.5);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.7)}
.sheen{position:absolute;inset:0;z-index:4;pointer-events:none;
  background:linear-gradient(148deg,rgba(255,255,255,.24) 0%,rgba(255,255,255,0) 46%)}
/* A hint of the stall's colour at the card's edge, not a halo around it: tight blur, low
   alpha, so it reads as the card being lit rather than glowing. */
.k-bonbon{box-shadow:0 0 12px rgba(158,26,56,.30),0 8px 22px rgba(0,0,0,.55)}
.k-kimchi{box-shadow:0 0 12px rgba(214,28,36,.28),0 8px 22px rgba(0,0,0,.55)}
.k-dvour{box-shadow:0 0 12px rgba(255,255,255,.16),0 8px 22px rgba(0,0,0,.58)}

/* the stall's own menu page */
.stallframe{position:absolute;inset:0;z-index:70;background:#000;
  animation:slidein .45s cubic-bezier(.2,.85,.25,1) both}
@keyframes slidein{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}
.stallframe iframe{width:100%;height:100%;border:0;display:block}
/* These MUST stay scoped under .fst. The reset four rules up is ".fst button", which is a
   class plus a type selector — more specific than a bare ".fback", so its background:none
   was quietly winning and the button has been fully transparent on every stall. What you
   could see was backdrop-filter blurring whatever sat behind it. */
.fst .fback{position:absolute;left:10px;top:12px;z-index:9;width:34px;height:34px;border-radius:10px;
  background:rgba(255,255,255,.22);backdrop-filter:blur(8px);color:#fff;font-size:23px;line-height:0;
  padding-bottom:4px;display:flex;align-items:center;justify-content:center}
/* Bon Bon's wood and D'VOUR's black board carry a white chevron fine. Kim Chi's board is
   white, so a translucent button vanished into it — that one is solid black. */
.fst .fb-kimchi{background:#111;color:#fff;backdrop-filter:none;box-shadow:0 2px 8px rgba(0,0,0,.35)}
`;
