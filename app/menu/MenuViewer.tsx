"use client";
import { useEffect, useRef, useState } from "react";

const PAGES = 11; // menu spreads (cover removed); images live at /menu/1.jpg … /menu/11.jpg

export default function MenuViewer() {
  const [i, setI] = useState(0);
  const [intro, setIntro] = useState(true);
  const [introOut, setIntroOut] = useState(false);

  // opening intro: white screen, Bon Bon logo fades in then out, then the menu shows
  useEffect(() => {
    const t1 = setTimeout(() => setIntroOut(true), 2100); // start lifting the white screen
    const t2 = setTimeout(() => setIntro(false), 3150); // remove it
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const go = (n: number) => setI((p) => { const t = n < 0 ? 0 : n > PAGES - 1 ? PAGES - 1 : n; return t === p ? p : t; });

  // one-finger swipe = change page; two fingers left alone for pinch-zoom
  const sx = useRef(0);
  const dx = useRef(0);
  const single = useRef(true);
  function onStart(e: React.TouchEvent) { single.current = e.touches.length === 1; sx.current = e.touches[0].clientX; dx.current = 0; }
  function onMove(e: React.TouchEvent) { if (e.touches.length === 1) dx.current = e.touches[0].clientX - sx.current; else single.current = false; }
  function onEnd() { if (single.current && Math.abs(dx.current) > 45) { if (dx.current < 0) go(i + 1); else go(i - 1); } }

  // keyboard arrows on desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(i + 1); else if (e.key === "ArrowLeft") go(i - 1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i]);

  return (
    <div className="wrap" onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
      <div className="track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {Array.from({ length: PAGES }, (_, n) => (
          <div className="slide" key={n}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/menu/${n + 1}.jpg`} alt={`Bon Bon menu page ${n + 1}`} draggable={false}
              loading={Math.abs(n - i) <= 1 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>

      {/* nav arrows */}
      <button className="arw l" aria-label="Previous" onClick={() => go(i - 1)} disabled={i === 0}>‹</button>
      <button className="arw r" aria-label="Next" onClick={() => go(i + 1)} disabled={i === PAGES - 1}>›</button>

      {/* page dots + counter */}
      <div className="dots">
        {Array.from({ length: PAGES }, (_, n) => (
          <span key={n} className={n === i ? "dot on" : "dot"} onClick={() => go(n)} />
        ))}
      </div>
      <div className="count">{i + 1} / {PAGES}</div>

      {/* opening intro */}
      {intro && (
        <div className={introOut ? "veil out" : "veil"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ilogo" src="/logo_web.png" alt="Bon Bon" />
        </div>
      )}

      <style>{`
        html, body { margin: 0; height: 100%; background: #17090d; }
        .wrap { position: fixed; inset: 0; overflow: hidden; background: #17090d; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .track { display: flex; height: 100%; transition: transform .5s cubic-bezier(.5,.05,.2,1); will-change: transform; }
        .slide { flex: 0 0 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .slide img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; user-select: none; -webkit-user-drag: none; }
        .arw { position: absolute; top: 50%; transform: translateY(-50%); width: 46px; height: 46px; border-radius: 50%;
          background: rgba(255,255,255,.14); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.3); color: #fff; font-size: 26px; line-height: 1; cursor: pointer;
          display: flex; align-items: center; justify-content: center; padding-bottom: 3px; transition: opacity .2s; z-index: 5; }
        .arw.l { left: 12px; } .arw.r { right: 12px; }
        .arw:disabled { opacity: 0; pointer-events: none; }
        @media (hover: none) { .arw { opacity: .55; } }
        .dots { position: absolute; left: 0; right: 0; bottom: 20px; display: flex; gap: 7px; justify-content: center; z-index: 5; flex-wrap: wrap; padding: 0 40px; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.32); cursor: pointer; }
        .dot.on { background: #fff; width: 20px; border-radius: 4px; }
        .count { position: absolute; top: 14px; right: 16px; color: rgba(255,255,255,.75); font-size: 12.5px; font-weight: 600;
          background: rgba(0,0,0,.28); padding: 4px 10px; border-radius: 20px; z-index: 5; }
        .veil { position: fixed; inset: 0; background: #fff; z-index: 50; display: flex; align-items: center; justify-content: center;
          transition: opacity .95s ease; opacity: 1; }
        .veil.out { opacity: 0; pointer-events: none; }
        .ilogo { width: 240px; max-width: 72%; height: auto; animation: ilogoin 1.4s ease both; }
        @keyframes ilogoin { from { opacity: 0; transform: scale(.93); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
