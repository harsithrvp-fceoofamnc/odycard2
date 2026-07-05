"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { C, Shell, NavLink, Spinner, useBBSession } from "../_ui";

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

const COLS: { key: string; label: string; next?: string; nextLabel?: string; color: string }[] = [
  { key: "new", label: "New", next: "preparing", nextLabel: "Start making", color: C.maroon },
  { key: "preparing", label: "Preparing", next: "ready", nextLabel: "Mark ready", color: "#b26a00" },
  { key: "ready", label: "Ready to serve", color: C.good },
];

function ago(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

export default function KitchenPage() {
  const { me, ready } = useBBSession(["admin", "supervisor", "kitchen"]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const seen = useRef<Set<number>>(new Set());
  const [tick, setTick] = useState(0); // re-render for the "x ago" timers
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
    const r = await fetch(`/api/bonbon/orders?status=active${outlet ? `&outlet=${outlet}` : ""}`);
    if (r.ok) {
      const list: Order[] = (await r.json()).orders || [];
      setOrders(list);
      setLoaded(true);
      // chime when a genuinely new ticket appears
      const fresh = list.filter((o) => o.status === "new" && !seen.current.has(o.ticket));
      if (fresh.length && seen.current.size) beep();
      list.forEach((o) => seen.current.add(o.ticket));
    }
  }, [outlet]);

  useEffect(() => {
    if (!ready) return;
    load();
    const a = setInterval(load, 5000);
    const b = setInterval(() => setTick((t) => t + 1), 15000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [ready, load]);

  async function advance(o: Order, status: string) {
    setOrders((p) => (status === "ready" ? p : p).map((x) => (x.id === o.id ? { ...x, status } : x)));
    await fetch(`/api/bonbon/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (!ready || !me) return <Spinner label="Checking access…" />;

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: C.mut }}>
          Live order tickets from the chatbot · refreshes every 5s
        </p>
        <span style={{ fontSize: 11.5, color: C.mut }} key={tick}>
          {orders.length} active
        </span>
      </div>

      {!loaded ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 14 }}>
          {COLS.map((col) => {
            const list = orders.filter((o) => o.status === col.key);
            return (
              <div key={col.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: col.color }} />
                  <span style={{ fontWeight: 800, color: C.ink, fontSize: 14 }}>{col.label}</span>
                  <span style={{ fontSize: 12, color: C.mut }}>{list.length}</span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {list.map((o) => (
                    <div key={o.id} style={{ ...ticket, borderTop: `3px solid ${col.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div style={{ fontWeight: 800, color: C.ink }}>#{o.ticket}</div>
                        <div style={{ fontSize: 11, color: C.mut }}>{ago(o.created_at)}</div>
                      </div>
                      <div style={{ fontSize: 11.5, color: C.mut, marginBottom: 8 }}>
                        {o.mode === "dine" ? `Dine-in${o.table ? " · " + o.table : ""}` : "Takeaway"} · {o.customer}
                      </div>
                      <div style={{ display: "grid", gap: 3, marginBottom: 10 }}>
                        {o.items.map((it, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                            <span style={{ color: C.ink }}>
                              <b style={{ color: col.color }}>{it.qty}×</b> {it.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      {col.next ? (
                        <button onClick={() => advance(o, col.next!)} style={{ ...advBtn, background: col.color }}>
                          {col.nextLabel}
                        </button>
                      ) : (
                        <div style={{ fontSize: 12, color: C.good, fontWeight: 700, textAlign: "center", padding: "6px 0" }}>
                          Waiting for waiter to serve
                        </div>
                      )}
                      {(o.status === "new" || o.status === "preparing") && (
                        <button onClick={() => advance(o, "cancelled")} style={cancelBtn}>
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                  {list.length === 0 && <div style={{ fontSize: 12.5, color: C.mut, padding: "6px 2px" }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.mut }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🍦</div>
      <div style={{ fontWeight: 700, color: C.ink }}>No orders yet</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>New tickets appear here the moment a customer pays in the chatbot.</div>
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
const advBtn: React.CSSProperties = { width: "100%", padding: "9px", border: 0, borderRadius: 9, color: "#fff", fontWeight: 800, fontSize: 13.5, cursor: "pointer" };
const cancelBtn: React.CSSProperties = { width: "100%", marginTop: 6, padding: "6px", border: "none", borderRadius: 8, background: "transparent", color: C.mut, fontWeight: 600, fontSize: 12, cursor: "pointer" };
