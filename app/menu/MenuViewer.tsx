"use client";
import { useEffect } from "react";

export type MenuItem = { name: string; price: number; badge: "best" | "must" | null };
export type MenuCategory = { key: string; title: string; hero: string; eyebrow: string | null; items: MenuItem[] };

// a distinct premium colour per category — deep jewel background + a soft accent for the trim
const THEMES: Record<string, { bg: string; acc: string }> = {
  scoops: { bg: "#47101c", acc: "#e9cf94" },
  softy: { bg: "#123a34", acc: "#dcc98f" },
  waffle: { bg: "#3a2412", acc: "#eab873" },
  icecream: { bg: "#211c1a", acc: "#e9cf94" },
  sundae: { bg: "#331642", acc: "#e6c1dd" },
  mini: { bg: "#45152b", acc: "#f0bcc7" },
  rolls: { bg: "#172542", acc: "#c3d4f0" },
  falooda: { bg: "#401238", acc: "#f0c4d6" },
  shakes: { bg: "#2b1d13", acc: "#e8caa2" },
  snacks: { bg: "#23301f", acc: "#dbc98f" },
};
const FALLBACK = { bg: "#47101c", acc: "#e9cf94" };

export default function MenuViewer({ categories }: { categories: MenuCategory[] }) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting && e.intersectionRatio > 0.3) e.target.classList.add("in"); else e.target.classList.remove("in"); }),
      { threshold: [0, 0.3, 0.6] }
    );
    document.querySelectorAll(".cat").forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <div className="app">
      <div className="intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo_web.png" alt="Bon Bon" />
        <div className="rule" />
        <div className="tag">Butter Crafted Ice Creams</div>
        <div className="hint">⌄</div>
      </div>

      {categories.map((c, ci) => {
        const t = THEMES[c.key] || FALLBACK;
        return (
          <section className="cat" key={c.key} style={{ ["--bg" as string]: t.bg, ["--acc" as string]: t.acc } as React.CSSProperties}>
            <div className="hero">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/${c.hero}.jpg`} alt="" />
              <div className="grad" />
              <div className="cap">
                <div className="idx">{String(ci + 1).padStart(2, "0")}</div>
                {c.eyebrow && <div className="eyebrow">{c.eyebrow}</div>}
                <div className="title serif">{c.title}</div>
              </div>
            </div>
            <div className="list">
              <div className="goldline" />
              {c.items.map((it, ri) => (
                <div className="row" key={ri} style={{ transitionDelay: `${Math.min(ri * 0.05, 0.55)}s` }}>
                  <span className="n">{it.name}{it.badge && <span className="badge">{it.badge === "best" ? "Bestseller" : "Must try"}</span>}</span>
                  <span className="dots" />
                  <span className="p">₹{it.price}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="foot"><div className="m serif">Bon Bon</div>Butter Crafted Ice Creams</div>

      <style>{`
        html,body{margin:0;height:100%;background:#000}
        .app{--cream:#f5e9e6;
          max-width:460px;margin:0 auto;height:100dvh;overflow-y:scroll;scroll-snap-type:y mandatory;background:#160b0e;position:relative;
          font-family:var(--f-sans),"Jost",sans-serif;color:var(--cream)}
        .app::-webkit-scrollbar{display:none}
        .serif{font-family:var(--f-serif),"Cormorant Garamond",serif}
        .intro{scroll-snap-align:start;scroll-snap-stop:always;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:34px;
          background:linear-gradient(rgba(18,8,4,.48),rgba(18,8,4,.52)),url('/wood_web.jpg') center/cover;color:#fff;position:relative}
        .intro img{width:80%;max-width:280px;filter:drop-shadow(0 0 10px rgba(255,255,255,.4)) drop-shadow(0 0 30px rgba(233,207,148,.28)) drop-shadow(0 3px 8px rgba(0,0,0,.5))}
        .intro .rule{width:46px;height:1px;background:#e9cf94;margin:22px 0 14px;opacity:.9}
        .intro .tag{font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#ecd9a6}
        .intro .hint{position:absolute;bottom:30px;color:#ecd9a6;font-size:22px;opacity:.85;animation:bob 1.8s ease-in-out infinite}
        @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
        .cat{scroll-snap-align:start;scroll-snap-stop:always;min-height:100dvh;display:flex;flex-direction:column;background:var(--bg)}
        .hero{position:relative;height:50dvh;min-height:300px;overflow:hidden;flex:0 0 auto}
        .hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.02)}
        .cat.in .hero img{animation:kb 16s ease-out forwards}
        @keyframes kb{from{transform:scale(1.02)}to{transform:scale(1.13)}}
        .hero .grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.22) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,.5) 72%,var(--bg) 100%)}
        .hero .cap{position:absolute;left:0;right:0;bottom:14px;padding:0 26px}
        .idx{font-size:11px;letter-spacing:3px;color:var(--acc);opacity:.9}
        .eyebrow{font-size:11px;font-weight:500;letter-spacing:4px;text-transform:uppercase;color:var(--acc);margin-top:6px}
        .title{font-size:44px;font-weight:600;line-height:.98;color:#fff;margin-top:2px;text-shadow:0 0 22px rgba(255,255,255,.16),0 2px 10px rgba(0,0,0,.5)}
        .list{flex:1;padding:20px 26px 40px}
        .goldline{width:100%;height:1px;background:linear-gradient(90deg,var(--acc),transparent);opacity:.55;margin:0 0 8px}
        .row{display:flex;align-items:baseline;padding:11px 0}
        .row .n{font-size:20px;font-weight:500;letter-spacing:.2px;white-space:nowrap;font-family:var(--f-serif),"Cormorant Garamond",serif;color:var(--cream)}
        .badge{font-family:var(--f-sans),"Jost",sans-serif;font-size:8.5px;font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:var(--acc);border:1px solid var(--acc);border-radius:3px;padding:2px 5px;margin-left:9px;vertical-align:3px;opacity:.9}
        .row .dots{flex:1;border-bottom:1px dotted var(--acc);opacity:.4;margin:0 10px;transform:translateY(-6px)}
        .row .p{font-family:var(--f-serif),"Cormorant Garamond",serif;font-size:20px;font-weight:600;color:#ffffff;white-space:nowrap}
        .row{opacity:0;transform:translateY(12px);transition:opacity .6s ease,transform .6s cubic-bezier(.3,.1,.2,1)}
        .cat.in .row{opacity:1;transform:none}
        .foot{scroll-snap-align:start;scroll-snap-stop:always;text-align:center;color:#b79a95;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:44px 20px 60px;background:#160b0e}
        .foot .m{font-family:var(--f-serif),"Cormorant Garamond",serif;font-size:30px;letter-spacing:0;color:#fff;text-transform:none;margin-bottom:8px}
      `}</style>
    </div>
  );
}
