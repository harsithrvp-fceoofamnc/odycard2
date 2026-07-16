"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { C, Shell, NavLink, Spinner, OutletSwitcher, useBBSession } from "../_ui";

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
  const meRef = useRef(me);
  meRef.current = me;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const seen = useRef<Set<number>>(new Set());
  const [outlet, setOutlet] = useState<string>("");
  const [outletName, setOutletName] = useState<string>("");
  const [soundOn, setSoundOn] = useState(false);

  // unlock audio on the first interaction anywhere on the page (browser autoplay rule)
  useEffect(() => {
    const unlock = () => {
      const ctx = audio();
      if (ctx && ctx.state === "running") {
        setSoundOn(true);
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

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
    // pending orders (new/preparing/ready). Waiters see only their assigned tables; admin/supervisor see all.
    const r = await fetch(`/api/bonbon/orders?status=active${outlet ? `&outlet=${outlet}` : ""}`);
    if (r.ok) {
      let list: Order[] = (await r.json()).orders || [];
      const m = meRef.current;
      if (m && m.role === "waiter") list = list.filter((o) => matchTable(o.table, m.tables || []));
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
        me.role === "waiter" ? undefined : (
          <>
            {me.role === "admin" && <NavLink href="/bon-bon/admin">Dashboard</NavLink>}
            <NavLink href="/bon-bon/manage">Menu</NavLink>
            <NavLink href="/bon-bon/kitchen">Kitchen</NavLink>
            <NavLink href="/bon-bon/waiter" active>
              Waiter
            </NavLink>
          </>
        )
      }
    >
      {me.role === "admin" && <OutletSwitcher />}
      {!soundOn && (
        <button
          onClick={() => { audio(); chime(); setSoundOn(true); }}
          style={{ width: "100%", marginBottom: 12, padding: "11px", border: `1px solid #eedcb0`, borderRadius: 10, background: "#fff8e8", color: C.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
        >
          🔊 Tap to turn on new-order sound
        </button>
      )}
      {soundOn && (
        <div style={{ margin: "0 0 12px", fontSize: 12, color: C.good, fontWeight: 600 }}>🔊 Order sound is on</div>
      )}
      <p style={{ margin: "0 0 14px", fontSize: 13, color: C.mut }}>
        {me.role === "waiter" ? (
          <>
            New orders for <b style={{ color: C.ink }}>your tables{me.tables && me.tables.length ? ` (${me.tables.join(", ")})` : ""}</b> show up here.
            Collect from the kitchen, serve, then tap <b>Served</b>.
          </>
        ) : (
          <>Live orders across all tables. Waiters see only the tables assigned to them.</>
        )}
      </p>
      {me.role === "waiter" && (!me.tables || me.tables.length === 0) && (
        <div style={{ margin: "0 0 14px", padding: "10px 12px", background: "#fff8e8", border: "1px solid #eedcb0", borderRadius: 10, fontSize: 12.5, color: C.ink }}>
          No tables are assigned to you yet — ask the owner to assign your tables from the dashboard.
        </div>
      )}

      {!loaded ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.mut }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 700, color: C.ink }}>All caught up</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>You&apos;ll get a chime when a new order comes in for your tables.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {orders.map((o) => (
            <div key={o.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${C.good}`, borderRadius: 13, padding: "13px 15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 800, color: C.ink, fontSize: 16 }}>#{o.ticket}</div>
                {o.table && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: C.maroon, padding: "3px 9px", borderRadius: 8 }}>{o.table}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.mut, margin: "3px 0 9px" }}>{o.customer}</div>
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

// does an order's free-text table ("Table 5") fall within this waiter's assigned numbers?
function matchTable(table: string, tables: number[]): boolean {
  const m = String(table || "").match(/\d+/);
  return m ? tables.includes(Number(m[0])) : false;
}

// One shared audio context, unlocked on the first user gesture. Browsers block sound until then,
// which is why a fresh context per chime stayed silent.
let _ac: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    if (!_ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      _ac = new AC();
    }
    if (_ac.state === "suspended") _ac.resume();
    return _ac;
  } catch {
    return null;
  }
}
// clear, attention-grabbing "new order" alert — three rising notes, played twice
function chime() {
  const ctx = audio();
  if (!ctx || ctx.state !== "running") return;
  const notes = [784, 988, 1319, 0, 784, 988, 1319]; // 0 = short gap
  notes.forEach((f, i) => {
    if (!f) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    o.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime + i * 0.15;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.start(t);
    o.stop(t + 0.32);
  });
}
