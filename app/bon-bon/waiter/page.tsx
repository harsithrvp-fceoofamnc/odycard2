"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { C, Shell, NavLink, Spinner, useBBSession } from "../_ui";

type Order = {
  id: string;
  ticket: number;
  items: { name: string; qty: number; price: number }[];
  customer: string;
  mode: string;
  table: string;
  status: string;
  updated_at: string;
};

export default function WaiterPage() {
  const { me, ready } = useBBSession(["admin", "supervisor", "waiter"]);
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
    const r = await fetch(`/api/bonbon/orders?status=ready${outlet ? `&outlet=${outlet}` : ""}`);
    if (r.ok) {
      const list: Order[] = (await r.json()).orders || [];
      const fresh = list.filter((o) => !seen.current.has(o.ticket));
      if (fresh.length && seen.current.size) chime();
      list.forEach((o) => seen.current.add(o.ticket));
      setOrders(list);
      setLoaded(true);
    }
  }, [outlet]);

  useEffect(() => {
    if (!ready) return;
    load();
    const t = setInterval(load, 3000);
    // browsers throttle background tabs — so refresh the moment this screen is looked at again
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [ready, load]);

  async function serve(o: Order) {
    setOrders((p) => p.filter((x) => x.id !== o.id));
    await fetch(`/api/bonbon/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "served" }),
    });
  }

  if (!ready || !me) return <Spinner label="Checking access…" />;

  return (
    <Shell
      title={outletName ? `Waiter — ${outletName}` : "Waiter"}
      role={me.role}
      name={me.name}
      nav={
        <>
          {me.role === "admin" && <NavLink href="/bon-bon/admin">Dashboard</NavLink>}
          {me.role !== "waiter" && <NavLink href="/bon-bon/manage">Menu</NavLink>}
          {me.role !== "waiter" && <NavLink href="/bon-bon/kitchen">Kitchen</NavLink>}
          <NavLink href="/bon-bon/waiter" active>
            Waiter
          </NavLink>
        </>
      }
    >
      <p style={{ margin: "0 0 14px", fontSize: 13, color: C.mut }}>
        Orders the kitchen has marked <b style={{ color: C.good }}>ready</b> show up here. Deliver them, then tap{" "}
        <b>Served</b>.
      </p>

      {!loaded ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.mut }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 700, color: C.ink }}>All caught up</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>You&apos;ll get a chime when the kitchen has something ready.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {orders.map((o) => (
            <div key={o.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${C.good}`, borderRadius: 13, padding: "13px 15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 800, color: C.ink, fontSize: 16 }}>#{o.ticket}</div>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.good, background: "#e6f4ea", padding: "3px 8px", borderRadius: 8 }}>READY</span>
              </div>
              <div style={{ fontSize: 12, color: C.mut, margin: "3px 0 9px" }}>
                {o.mode === "dine" ? `Dine-in${o.table ? " · " + o.table : ""}` : "Takeaway"} · {o.customer}
              </div>
              <div style={{ display: "grid", gap: 3, marginBottom: 11 }}>
                {o.items.map((it, i) => (
                  <div key={i} style={{ fontSize: 13.5, color: C.ink }}>
                    <b style={{ color: C.good }}>{it.qty}×</b> {it.name}
                  </div>
                ))}
              </div>
              <button onClick={() => serve(o)} style={{ width: "100%", padding: "11px", border: 0, borderRadius: 10, background: C.good, color: "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer" }}>
                Served
              </button>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

function chime() {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.start(t);
      o.stop(t + 0.31);
    });
  } catch {}
}
