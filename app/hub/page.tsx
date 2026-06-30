"use client";
import { useEffect, useState } from "react";

type Link = { title: string; sub: string; href: string; blank?: boolean; c: string };
type Group = { label: string; items: Link[] };

const GROUPS: Group[] = [
  {
    label: "AI Waiter",
    items: [
      { title: "Sree Annapoorna", sub: "Live AI waiter — full menu demo", href: "/annapoorna", c: "#e3b956" },
      { title: "White-label demo", sub: "Generic branded restaurant bot", href: "/restaurant", c: "#5dcaa5" },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Admin dashboard", sub: "Branches, staff, sales (owner)", href: "/admin", c: "#4285f4" },
      { title: "Supervisor", sub: "Branch staff & waiters", href: "/supervisor", c: "#7c4dff" },
      { title: "Waiter", sub: "Floor app login", href: "/waiter", c: "#34a853" },
      { title: "Sign up", sub: "Create an admin account", href: "/signup", c: "#f0997b" },
      { title: "Log in", sub: "Owner / staff login", href: "/login", c: "#9aa3b5" },
    ],
  },
  {
    label: "Operations demos",
    items: [
      { title: "Kitchen display — fast food", sub: "Live order tickets board", href: "/demos/kitchen_display_demo.html", blank: true, c: "#ef9f27" },
      { title: "Kitchen display — dine-in", sub: "Table rounds + re-order priority", href: "/demos/dinein_kitchen_demo.html", blank: true, c: "#e24b4a" },
      { title: "Waiter app", sub: "Ready-order alerts per zone", href: "/demos/waiter_app_demo.html", blank: true, c: "#1d9e75" },
    ],
  },
];

export default function Hub() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  let idx = 0;

  return (
    <div className="hub">
      <div className="glow g1" />
      <div className="glow g2" />
      <div className="grid" />

      <header className="head">
        <div className="orb"><span>O</span></div>
        <div>
          <div className="word">ODYSRA</div>
          <div className="sub">Control hub · pick a destination</div>
        </div>
      </header>

      <main className="wrap">
        {GROUPS.map((g) => (
          <section key={g.label} className="sec">
            <div className="seclab">{g.label}</div>
            <div className="cards">
              {g.items.map((it) => {
                const d = idx++;
                return (
                  <a
                    key={it.href}
                    href={it.href}
                    target={it.blank ? "_blank" : undefined}
                    rel={it.blank ? "noopener noreferrer" : undefined}
                    className={"card" + (mounted ? " in" : "")}
                    style={{ "--c": it.c, animationDelay: `${d * 55}ms` } as React.CSSProperties}
                  >
                    <span className="dot" />
                    <div className="ct">
                      <div className="t">{it.title}</div>
                      <div className="s">{it.sub}</div>
                    </div>
                    <span className="arr">→</span>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
        <div className="footer">Odysra · authorised internal access</div>
      </main>

      <style>{`
        *{box-sizing:border-box}
        .hub{position:relative;min-height:100vh;overflow-x:hidden;color:#e9edf5;
          background:radial-gradient(1100px 700px at 50% -10%,#1a2030 0%,#0c0e14 55%,#08090d 100%);
          font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:26px 18px 60px}
        .grid{position:fixed;inset:0;z-index:0;background-image:linear-gradient(rgba(227,185,86,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(227,185,86,.045) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(circle at 50% 30%,#000,transparent 80%);-webkit-mask-image:radial-gradient(circle at 50% 30%,#000,transparent 80%)}
        .glow{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0}
        .g1{width:520px;height:520px;background:radial-gradient(circle,#c79233,transparent 65%);opacity:.4;top:-200px;left:-140px;animation:f1 17s ease-in-out infinite}
        .g2{width:480px;height:480px;background:radial-gradient(circle,#3d6bff,transparent 65%);opacity:.3;bottom:-220px;right:-160px;animation:f2 21s ease-in-out infinite}
        @keyframes f1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,46px)}}
        @keyframes f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-40px)}}
        .head{position:relative;z-index:2;display:flex;align-items:center;gap:14px;max-width:880px;margin:6px auto 26px}
        .orb{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#1b1408;font-weight:800;font-size:24px;
          background:conic-gradient(from 130deg,#e3b956,#c79233,#f0d28a,#c79233,#e3b956);box-shadow:0 0 0 1px rgba(227,185,86,.5),0 10px 26px rgba(199,146,51,.4);animation:spin 12s linear infinite}
        .orb span{animation:spin 12s linear infinite reverse;display:block}
        @keyframes spin{to{transform:rotate(360deg)}}
        .word{font-size:23px;font-weight:800;letter-spacing:3px;background:linear-gradient(100deg,#f3d9a0,#e3b956,#fff4d6,#e3b956);-webkit-background-clip:text;background-clip:text;color:transparent;background-size:250% 100%;animation:hue 7s linear infinite}
        @keyframes hue{to{background-position:250% 0}}
        .sub{font-size:12.5px;color:#9aa3b5;margin-top:2px}
        .wrap{position:relative;z-index:2;max-width:880px;margin:0 auto}
        .sec{margin-bottom:24px}
        .seclab{font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c79233;margin:0 4px 12px}
        .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
        .card{display:flex;align-items:center;gap:13px;padding:15px 16px;border-radius:16px;text-decoration:none;color:inherit;
          background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          opacity:0;transform:translateY(12px);transition:transform .2s,box-shadow .25s,border-color .25s,background .25s}
        .card.in{animation:rise .5s ease forwards}
        @keyframes rise{to{opacity:1;transform:none}}
        .card:hover{transform:translateY(-3px);border-color:var(--c);background:rgba(255,255,255,.07);box-shadow:0 14px 34px rgba(0,0,0,.5),0 0 0 1px var(--c),0 0 26px -6px var(--c)}
        .dot{width:11px;height:11px;border-radius:50%;flex:0 0 auto;background:var(--c);box-shadow:0 0 12px var(--c)}
        .ct{flex:1;min-width:0}
        .t{font-size:15.5px;font-weight:700;color:#f2f5fb}
        .s{font-size:12px;color:#97a0b2;margin-top:2px}
        .arr{color:var(--c);font-size:18px;opacity:.7;transition:transform .2s,opacity .2s}
        .card:hover .arr{transform:translateX(4px);opacity:1}
        .footer{text-align:center;color:#5e6678;font-size:11.5px;letter-spacing:.4px;margin-top:30px}
      `}</style>
    </div>
  );
}
