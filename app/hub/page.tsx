"use client";
import { useEffect, useState } from "react";

type Item = { title: string; sub: string; href: string; blank?: boolean };
type Group = { label: string; accent: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "AI Waiter",
    accent: "#2f6fed",
    items: [
      { title: "Sree Annapoorna", sub: "Live AI waiter — full menu demo", href: "/annapoorna" },
      { title: "White-label demo", sub: "Generic branded restaurant bot", href: "/restaurant" },
    ],
  },
  {
    label: "Platform",
    accent: "#14918a",
    items: [
      { title: "Admin dashboard", sub: "Branches, staff, sales (owner)", href: "/admin" },
      { title: "Supervisor", sub: "Branch staff & waiters", href: "/supervisor" },
      { title: "Waiter", sub: "Floor app login", href: "/waiter" },
      { title: "Sign up", sub: "Create an admin account", href: "/signup" },
      { title: "Log in", sub: "Owner / staff login", href: "/login" },
    ],
  },
  {
    label: "Operations demos",
    accent: "#c08a2e",
    items: [
      { title: "Kitchen display — fast food", sub: "Live order tickets board", href: "/demos/kitchen_display_demo.html", blank: true },
      { title: "Kitchen display — dine-in", sub: "Table rounds + re-order priority", href: "/demos/dinein_kitchen_demo.html", blank: true },
      { title: "Waiter app", sub: "Ready-order alerts per zone", href: "/demos/waiter_app_demo.html", blank: true },
    ],
  },
];

export default function Hub() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  let idx = 0;

  return (
    <div className="hub">
      <header className="head">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/odysra_logo.png" alt="Odysra" />
          <div>
            <div className="word">ODYSRA</div>
            <div className="sub">Control hub · pick a destination</div>
          </div>
        </div>
      </header>

      <main className="wrap">
        {GROUPS.map((g) => (
          <section key={g.label} className="sec">
            <div className="seclab"><span className="sq" style={{ background: g.accent }} />{g.label}</div>
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
                    style={{ "--c": g.accent, animationDelay: `${d * 45}ms` } as React.CSSProperties}
                  >
                    <span className="bar" />
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
        .hub{min-height:100vh;background:radial-gradient(900px 560px at 50% -8%,#ffffff,#f4f5f7 72%);
          color:#15171c;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Inter,sans-serif;padding:30px 18px 60px}
        .head{max-width:880px;margin:0 auto 26px}
        .brand{display:flex;align-items:center;gap:13px}
        .logo{width:46px;height:46px;object-fit:contain;display:block}
        .word{font-size:21px;font-weight:800;letter-spacing:4px;color:#15171c}
        .sub{font-size:12.5px;color:#8a909c;margin-top:2px}
        .wrap{max-width:880px;margin:0 auto}
        .sec{margin-bottom:26px}
        .seclab{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;margin:0 2px 12px}
        .sq{width:9px;height:9px;border-radius:3px;display:inline-block}
        .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:12px}
        .card{position:relative;display:flex;align-items:center;gap:13px;padding:15px 16px 15px 17px;border-radius:14px;text-decoration:none;color:inherit;overflow:hidden;
          background:#fff;border:1px solid #e7e9ee;box-shadow:0 1px 2px rgba(17,19,24,.04);
          opacity:0;transform:translateY(10px);transition:transform .18s,box-shadow .22s,border-color .22s}
        .card.in{animation:rise .45s ease forwards}
        @keyframes rise{to{opacity:1;transform:none}}
        .card .bar{position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--c);opacity:0;transition:opacity .2s}
        .card:hover{transform:translateY(-2px);border-color:#d3d7df;box-shadow:0 12px 26px rgba(17,19,24,.10)}
        .card:hover .bar{opacity:1}
        .ct{flex:1;min-width:0}
        .t{font-size:15.5px;font-weight:700;color:#15171c}
        .s{font-size:12px;color:#8a909c;margin-top:2px}
        .arr{color:#b6bcc7;font-size:18px;transition:transform .2s,color .2s}
        .card:hover .arr{transform:translateX(4px);color:var(--c)}
        .footer{text-align:center;color:#a2a8b4;font-size:11.5px;margin-top:30px;letter-spacing:.3px}
      `}</style>
    </div>
  );
}
