"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Scoop Stacker — tap to drop each scoop on the one below. Overhang gets trimmed, so a sloppy
// stack narrows fast. Pure fun while guests wait; no accounts, no data, nothing to lose.

type Slab = { x: number; w: number; c: string; f: string };
type Falling = { id: number; x: number; w: number; c: string; bottom: number; dir: number };

const FLAVOURS = [
  { c: "#f4a9c0", f: "Strawberry" },
  { c: "#7b4a2d", f: "Death by Chocolate" },
  { c: "#f7e6bd", f: "French Vanilla" },
  { c: "#dda63f", f: "Butterscotch" },
  { c: "#94c9a4", f: "Pista" },
  { c: "#f2a45c", f: "Alphonso Mango" },
  { c: "#6f4e37", f: "Filter Coffee" },
  { c: "#bd6b93", f: "Black Currant" },
  { c: "#ecd7bd", f: "Royal Badam" },
  { c: "#9ad2e6", f: "Bubblegum" },
];

const H = 30; // scoop height
const VISIBLE = 9; // rows before the camera starts following
const CONE = 54;
const START_W = 150;

const pick = (i: number) => FLAVOURS[i % FLAVOURS.length];

export default function ScoopStacker() {
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [stack, setStack] = useState<Slab[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [perfect, setPerfect] = useState(0); // bump to replay the "Perfect!" flash
  const [falling, setFalling] = useState<Falling[]>([]);
  const [boardW, setBoardW] = useState(320);

  const wrapRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<{ x: number; w: number; dir: number; speed: number; c: string; f: string } | null>(null);
  const fallId = useRef(0);

  // measure the play area so the game fills any phone width
  useEffect(() => {
    const fit = () => {
      const w = wrapRef.current?.clientWidth;
      if (w) setBoardW(Math.min(360, Math.max(260, w)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const spawn = useCallback((w: number, n: number) => {
    const fl = pick(n);
    curRef.current = { x: 0, w, dir: 1, speed: Math.min(6.2, 1.7 + n * 0.11), c: fl.c, f: fl.f };
  }, []);

  const start = useCallback(() => {
    const base: Slab = { x: (boardW - START_W) / 2, w: START_W, c: FLAVOURS[0].c, f: FLAVOURS[0].f };
    setStack([base]);
    setScore(0);
    setFalling([]);
    spawn(START_W, 1);
    setPhase("play");
  }, [boardW, spawn]);

  // the swinging scoop
  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    const loop = () => {
      const c = curRef.current;
      if (c) {
        c.x += c.dir * c.speed;
        if (c.x <= 0) { c.x = 0; c.dir = 1; }
        if (c.x + c.w >= boardW) { c.x = boardW - c.w; c.dir = -1; }
        const el = movingRef.current;
        if (el) { el.style.transform = `translateX(${c.x}px)`; el.style.width = c.w + "px"; }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, boardW]);

  const drop = useCallback(() => {
    if (phase === "ready") return start();
    if (phase === "over") return start();
    const c = curRef.current;
    if (!c) return;
    const top = stack[stack.length - 1];
    if (!top) return;
    const delta = c.x - top.x;
    const overlap = top.w - Math.abs(delta);

    if (overlap <= 6) {
      // missed the tower entirely — the scoop tumbles off
      setFalling((f) => [...f, { id: fallId.current++, x: c.x, w: c.w, c: c.c, bottom: CONE + stack.length * H, dir: delta > 0 ? 1 : -1 }]);
      curRef.current = null;
      setBest((b) => Math.max(b, score));
      setPhase("over");
      return;
    }

    const clean = Math.abs(delta) < 5; // near-perfect — keep the full width as a reward
    const newW = clean ? top.w : overlap;
    const newX = clean ? top.x : Math.max(c.x, top.x);
    if (clean) setPerfect((p) => p + 1);
    else {
      // the trimmed sliver falls away
      const sliverX = delta > 0 ? top.x + top.w : c.x;
      setFalling((f) => [...f, { id: fallId.current++, x: sliverX, w: Math.abs(delta), c: c.c, bottom: CONE + stack.length * H, dir: delta > 0 ? 1 : -1 }]);
    }

    const next = [...stack, { x: newX, w: newW, c: c.c, f: c.f }];
    setStack(next);
    setScore(next.length - 1);
    spawn(newW, next.length);
  }, [phase, stack, score, start, spawn]);

  // clear tumbling pieces after their animation
  useEffect(() => {
    if (!falling.length) return;
    const t = setTimeout(() => setFalling((f) => f.slice(1)), 700);
    return () => clearTimeout(t);
  }, [falling]);

  // tap / click / space / enter
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); drop(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [drop]);

  const lift = Math.max(0, (stack.length - (VISIBLE - 2)) * H);
  const cur = curRef.current;
  const topFlavour = stack.length > 1 ? stack[stack.length - 1].f : "";
  const medal = score >= 25 ? "🏆" : score >= 15 ? "🥇" : score >= 8 ? "🥈" : score >= 4 ? "🥉" : "🍦";
  const verdict =
    score >= 25 ? "Legendary. The counter staff would be impressed." :
    score >= 15 ? "Serious stacking skill." :
    score >= 8 ? "Nice tower!" :
    score >= 4 ? "Not bad — go again?" :
    "Everyone starts somewhere 😄";

  return (
    <div className="gm" onPointerDown={drop}>
      <style>{CSS}</style>

      <header className="gh">
        <a className="gback" href="/menu" onPointerDown={(e) => e.stopPropagation()}>← Menu</a>
        <div className="gsc">
          <b>{score}</b>
          <span>scoops</span>
        </div>
        <div className="gbest">Best {best}</div>
      </header>

      <div className="gboard" ref={wrapRef}>
        <div className="gstage" style={{ width: boardW }}>
          <div className="gworld" style={{ transform: `translateY(${lift}px)` }}>
            {/* cone */}
            <div className="gcone" style={{ left: (boardW - 86) / 2 }}>
              <div className="gwaffle" />
            </div>

            {stack.map((s, i) => (
              <div key={i} className="gscoop" style={{ left: s.x, width: s.w, bottom: CONE + i * H, background: s.c }}>
                <span className="gshine" />
              </div>
            ))}

            {falling.map((f) => (
              <div key={f.id} className="gfall" style={{ left: f.x, width: f.w, bottom: f.bottom, background: f.c, ["--d" as string]: f.dir }} />
            ))}

            {phase === "play" && cur && (
              <div ref={movingRef} className="gscoop gmove" style={{ width: cur.w, bottom: CONE + stack.length * H, background: cur.c }}>
                <span className="gshine" />
              </div>
            )}
          </div>

          {perfect > 0 && phase === "play" && <div key={perfect} className="gperfect">Perfect! 🎯</div>}
        </div>

        {phase === "play" && topFlavour && <div className="gflav">{topFlavour}</div>}
      </div>

      {phase === "ready" && (
        <div className="gover">
          <div className="gcard">
            <div className="gemoji">🍨</div>
            <h1>Scoop Stacker</h1>
            <p>Tap to drop each scoop. Line it up — whatever hangs over gets trimmed off.</p>
            <button className="gbtn">Tap to start</button>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="gover">
          <div className="gcard">
            <div className="gemoji">{medal}</div>
            <h1>{score} scoops</h1>
            <p>{verdict}</p>
            {best > 0 && <div className="gbestline">Best today · {Math.max(best, score)}</div>}
            <button className="gbtn">Play again</button>
            <a className="glink" href="/menu" onPointerDown={(e) => e.stopPropagation()}>Back to the menu</a>
          </div>
        </div>
      )}

      {phase === "play" && <div className="ghint">tap anywhere to drop</div>}
    </div>
  );
}

const CSS = `
.gm{position:fixed;inset:0;overflow:hidden;background:linear-gradient(180deg,#fbeef1 0%,#f6dfe6 45%,#efd0da 100%);
  font-family:-apple-system,"Segoe UI",Roboto,system-ui,sans-serif;color:#2a121a;user-select:none;-webkit-user-select:none;
  touch-action:manipulation;display:flex;flex-direction:column;align-items:center}
.gm *{box-sizing:border-box}

.gh{width:100%;max-width:460px;display:flex;align-items:center;gap:10px;padding:14px 16px 6px}
.gback{font-size:13px;font-weight:700;color:#8a1530;text-decoration:none;background:rgba(255,255,255,.7);
  padding:7px 12px;border-radius:20px}
.gsc{margin-left:auto;text-align:center;line-height:1}
.gsc b{display:block;font-size:30px;font-weight:800;letter-spacing:-.02em;color:#8a1530;font-variant-numeric:tabular-nums}
.gsc span{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#b08a96}
.gbest{margin-left:auto;font-size:12px;font-weight:700;color:#a8798a;background:rgba(255,255,255,.7);padding:7px 12px;border-radius:20px}

.gboard{flex:1;width:100%;max-width:460px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:34px;min-height:0}
.gstage{position:relative;height:min(74vh,520px);overflow:hidden}
.gworld{position:absolute;inset:0;transition:transform .28s cubic-bezier(.2,.8,.2,1)}

.gcone{position:absolute;bottom:0;width:86px;height:${CONE}px;
  background:linear-gradient(180deg,#e0a765,#c9873f);clip-path:polygon(0 0,100% 0,50% 100%);
  border-radius:5px 5px 0 0}
.gwaffle{position:absolute;inset:0;opacity:.35;clip-path:polygon(0 0,100% 0,50% 100%);
  background:repeating-linear-gradient(45deg,transparent 0 7px,rgba(120,70,20,.55) 7px 8px),
             repeating-linear-gradient(-45deg,transparent 0 7px,rgba(120,70,20,.55) 7px 8px)}

.gscoop{position:absolute;height:${H - 4}px;border-radius:14px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.12),0 2px 5px rgba(60,20,35,.16)}
.gscoop .gshine{position:absolute;left:9px;top:5px;width:26%;height:6px;border-radius:6px;background:rgba(255,255,255,.5)}
.gmove{will-change:transform}
.gfall{position:absolute;height:${H - 4}px;border-radius:14px;opacity:.95;animation:gtumble .7s ease-in forwards}
@keyframes gtumble{to{transform:translate(calc(var(--d)*70px),340px) rotate(calc(var(--d)*70deg));opacity:0}}

.gperfect{position:absolute;left:0;right:0;top:14%;text-align:center;font-size:19px;font-weight:800;color:#0e7a55;
  animation:gpf .9s ease-out forwards;pointer-events:none}
@keyframes gpf{0%{opacity:0;transform:scale(.7)}25%{opacity:1;transform:scale(1.06)}100%{opacity:0;transform:translateY(-26px) scale(1)}}

.gflav{margin-top:12px;font-size:13px;font-weight:700;color:#8a1530;background:rgba(255,255,255,.75);
  padding:7px 15px;border-radius:20px}
.ghint{position:absolute;bottom:14px;left:0;right:0;text-align:center;font-size:11.5px;font-weight:600;
  letter-spacing:.06em;text-transform:uppercase;color:#bb92a0;animation:gpulse 2s infinite}
@keyframes gpulse{0%,100%{opacity:.5}50%{opacity:1}}

.gover{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:22px;
  background:rgba(42,18,26,.32);backdrop-filter:blur(3px);z-index:10}
.gcard{background:#fff;border-radius:24px;padding:28px 24px 24px;text-align:center;width:100%;max-width:320px;
  box-shadow:0 20px 50px rgba(42,18,26,.3);animation:gpop .34s cubic-bezier(.2,.9,.3,1.2)}
@keyframes gpop{from{opacity:0;transform:scale(.9) translateY(14px)}to{opacity:1;transform:none}}
.gemoji{font-size:52px;line-height:1}
.gcard h1{margin:8px 0 6px;font-size:27px;font-weight:800;letter-spacing:-.02em;color:#2a121a}
.gcard p{margin:0;font-size:14px;line-height:1.55;color:#7a6a70}
.gbestline{margin-top:12px;font-size:12px;font-weight:700;color:#a8798a}
.gbtn{margin-top:18px;width:100%;border:0;border-radius:14px;padding:14px;font-family:inherit;font-size:15.5px;
  font-weight:800;color:#fff;background:linear-gradient(135deg,#8a1530,#b0324f);cursor:pointer;
  box-shadow:0 6px 16px rgba(138,21,48,.3)}
.glink{display:inline-block;margin-top:13px;font-size:13px;font-weight:600;color:#a8798a;text-decoration:none}
`;
