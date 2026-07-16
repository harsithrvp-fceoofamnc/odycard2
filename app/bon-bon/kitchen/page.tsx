"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { C, Shell, NavLink, Spinner, OutletSwitcher, useBBSession } from "../_ui";

type Order = {
  id: string;
  ticket: number;
  items: { name: string; qty: number; price: number }[];
  total: number;
  customer: string;
  mode: string;
  table: string;
  status: string;
  created_at: string;
};

// Kitchen is a READ-ONLY board: every order placed today (pending + served), no controls.
// It's for making the orders and cross-checking the day's sales.
function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function statusOf(s: string): { label: string; bg: string; fg: string } {
  if (s === "served") return { label: "Served", bg: "#e6f4ea", fg: C.good };
  if (s === "cancelled") return { label: "Cancelled", bg: "#eee", fg: "#888" };
  return { label: "Pending", bg: "#fff3e0", fg: "#b26a00" };
}

export default function KitchenPage() {
  const { me, ready } = useBBSession(["admin", "supervisor", "kitchen"]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const seen = useRef<Set<number>>(new Set());
  const [outlet, setOutlet] = useState<string>("");
  const [outletName, setOutletName] = useState<string>("");

  useEffect(() => {
    const o = new URLSearchParams(window.location.search).get("outlet") || "";
    setOutlet(o);
    if (o) {
      fetch("/api/bonbon/outlets")
        .then((r) => (r.ok ? r.json() : { outlets: [] }))
        .then((d) => { const f = (d.outlets || []).find((x: { id: number }) => String(x.id) === o); if (f) setOutletName(f.name); })
        .catch(() => {});
    }
  }, []);

  const load = useCallback(async () => {
    const r = await fetch(`/api/bonbon/orders?status=all${outlet ? `&outlet=${outlet}` : ""}`);
    if (r.ok) {
      const list: Order[] = ((await r.json()).orders || []).filter((o: Order) => isToday(o.created_at));
      setOrders(list);
      setLoaded(true);
      // chime when a genuinely new (pending) ticket appears
      const fresh = list.filter((o) => o.status !== "served" && o.status !== "cancelled" && !seen.current.has(o.ticket));
      if (fresh.length && seen.current.size) beep();
      list.forEach((o) => seen.current.add(o.ticket));
    }
  }, [outlet]);

  useEffect(() => {
    if (!ready) return;
    load();
    const a = setInterval(load, 3000);
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(a);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [ready, load]);

  if (!ready || !me) return <Spinner label="Checking access…" />;

  const live = orders.filter((o) => o.status !== "cancelled");
  const sales = live.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const pending = orders.filter((o) => o.status !== "served" && o.status !== "cancelled").length;
  const served = orders.filter((o) => o.status === "served").length;

  return (
    <Shell
      title={outletName ? `Kitchen — ${outletName}` : "Kitchen display"}
      role={me.role}
      name={me.name}
      nav={
        <>
          {me.role === "admin" && <NavLink href="/bon-bon/admin">Dashboard</NavLink>}
          {(me.role === "admin" || me.role === "supervisor") && <NavLink href="/bon-bon/manage">Menu</NavLink>}
          <NavLink href="/bon-bon/kitchen" active>
            Kitchen
          </NavLink>
          {(me.role === "admin" || me.role === "supervisor") && <NavLink href="/bon-bon/waiter">Waiter</NavLink>}
        </>
      }
    >
      {me.role === "admin" && <OutletSwitcher />}

      {/* today's summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "0 0 14px" }}>
        <Stat label="Orders" value={String(live.length)} />
        <Stat label="Pending" value={String(pending)} color="#b26a00" />
        <Stat label="Served" value={String(served)} color={C.good} />
        <Stat label="Sales" value={`₹${sales}`} color={C.maroon} />
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: C.mut }}>
        Every order placed today — pending &amp; served. Display only; the waiter marks orders served.
      </p>

      {!loaded ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          {orders.map((o) => {
            const st = statusOf(o.status);
            const cancelled = o.status === "cancelled";
            return (
              <div key={o.id} style={{ ...ticket, borderTop: `3px solid ${st.fg}`, opacity: cancelled ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800, color: C.ink }}>
                    #{o.ticket}
                    {o.table && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 800, color: "#fff", background: C.maroon, padding: "2px 8px", borderRadius: 7 }}>{o.table}</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: st.fg, background: st.bg, padding: "3px 8px", borderRadius: 8 }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 11.5, color: C.mut, margin: "4px 0 8px" }}>
                  {clock(o.created_at)} · {o.customer}
                </div>
                <div style={{ display: "grid", gap: 3, marginBottom: 8 }}>
                  {o.items.map((it, i) => (
                    <div key={i} style={{ fontSize: 13.5, color: C.ink, textDecoration: cancelled ? "line-through" : "none" }}>
                      <b style={{ color: st.fg }}>{it.qty}×</b> {it.name}
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "right", fontWeight: 800, color: C.ink, fontSize: 14 }}>₹{o.total}</div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 11, padding: "9px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: color || C.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: C.mut, marginTop: 1 }}>{label}</div>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.mut }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🍦</div>
      <div style={{ fontWeight: 700, color: C.ink }}>No orders today yet</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>Tickets appear here the moment a customer pays in the chatbot.</div>
    </div>
  );
}

function beep() {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start();
    o.stop(ctx.currentTime + 0.36);
  } catch {}
}

const ticket: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 13px" };
