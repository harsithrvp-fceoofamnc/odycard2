"use client";
import { useCallback, useEffect, useState } from "react";
import { C, Shell, NavLink, Spinner, useBBSession } from "../_ui";
import { catOrder, catLabels, BBMenuItem } from "@/lib/bonbonMenu";

export default function ManagePage() {
  const { me, ready } = useBBSession(["admin", "supervisor"]);
  const [items, setItems] = useState<BBMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("scoops");
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [outlet, setOutlet] = useState<string>(""); // which outlet's menu we're editing (from ?outlet=)
  const [outletName, setOutletName] = useState<string>("");

  useEffect(() => {
    const o = new URLSearchParams(window.location.search).get("outlet") || "";
    setOutlet(o);
    if (o) {
      fetch("/api/bonbon/outlets")
        .then((r) => (r.ok ? r.json() : { outlets: [] }))
        .then((d) => {
          const found = (d.outlets || []).find((x: { id: number }) => String(x.id) === o);
          if (found) setOutletName(found.name);
        })
        .catch(() => {});
    }
  }, []);
  const qs = outlet ? `?outlet=${outlet}` : "";

  const load = useCallback(async () => {
    const r = await fetch(`/api/bonbon/menu${outlet ? `?outlet=${outlet}` : ""}`);
    if (r.ok) {
      const d = await r.json();
      setItems((d.items as BBMenuItem[]).filter((x) => x.cat !== "addon"));
    }
    setLoading(false);
  }, [outlet]);
  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function patch(key: string, body: Partial<BBMenuItem>) {
    // optimistic
    setItems((prev) => prev.map((x) => (x.key === key ? { ...x, ...body } : x)));
    const r = await fetch(`/api/bonbon/menu/${key}${qs}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) load(); // revert to server truth on failure
  }

  async function del(key: string) {
    if (!confirm("Remove this item from the menu?")) return;
    setItems((prev) => prev.filter((x) => x.key !== key));
    await fetch(`/api/bonbon/menu/${key}${qs}`, { method: "DELETE" });
  }

  if (!ready || !me) return <Spinner label="Checking access…" />;

  const shown = items.filter((x) => x.cat === tab);

  return (
    <Shell
      title={outletName ? `Menu — ${outletName}` : "Menu manager"}
      role={me.role}
      name={me.name}
      nav={
        <>
          {me.role === "admin" && <NavLink href="/bon-bon/admin">Dashboard</NavLink>}
          <NavLink href="/bon-bon/manage" active>
            Menu
          </NavLink>
          <NavLink href="/bon-bon/kitchen">Kitchen</NavLink>
          <NavLink href="/bon-bon/waiter">Waiter</NavLink>
        </>
      }
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.mut, maxWidth: 620, lineHeight: 1.5 }}>
          Edit prices, hide items, mark sold-out, or promote to <b>Best seller</b> / <b>Must try</b>. Changes save
          instantly and show in the customer chatbot.
        </p>
        <button onClick={() => setAdding(true)} style={primaryBtn}>
          + Add item
        </button>
      </div>

      {/* category tabs */}
      <div style={{ display: "flex", gap: 7, overflowX: "auto", margin: "16px 0 14px", paddingBottom: 4 }}>
        {catOrder.map((c) => {
          const n = items.filter((x) => x.cat === c).length;
          return (
            <button
              key={c}
              onClick={() => setTab(c)}
              style={{
                padding: "8px 13px",
                borderRadius: 10,
                border: `1.5px solid ${tab === c ? C.maroon : C.line}`,
                background: tab === c ? C.maroon : C.card,
                color: tab === c ? "#fff" : C.ink,
                fontWeight: 700,
                fontSize: 13,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {catLabels[c]} <span style={{ opacity: 0.7 }}>{n}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {shown.length === 0 && <div style={{ color: C.mut, padding: 20 }}>No items in this category.</div>}
          {shown.map((it) => (
            <ItemRow
              key={it.key}
              it={it}
              editing={editing === it.key}
              onEdit={() => setEditing(editing === it.key ? null : it.key)}
              onPatch={(b) => patch(it.key, b)}
              onSave={() => setEditing(null)}
              onDelete={() => del(it.key)}
            />
          ))}
        </div>
      )}

      {adding && <AddModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} defaultCat={tab} outlet={outlet} />}
    </Shell>
  );
}

function Toggle({ on, label, color, onClick }: { on: boolean; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 10px",
        borderRadius: 20,
        border: `1.5px solid ${on ? color : C.line}`,
        background: on ? color : "#fff",
        color: on ? "#fff" : C.mut,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ItemRow({
  it,
  editing,
  onEdit,
  onPatch,
  onSave,
  onDelete,
}: {
  it: BBMenuItem;
  editing: boolean;
  onEdit: () => void;
  onPatch: (b: Partial<BBMenuItem>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [f, setF] = useState({ name: it.name, price: it.price, price500: it.price500 || 0, q: it.q, pt: it.pt, desc: it.desc });
  const [upBusy, setUpBusy] = useState(false);
  useEffect(() => {
    setF({ name: it.name, price: it.price, price500: it.price500 || 0, q: it.q, pt: it.pt, desc: it.desc });
  }, [it, editing]);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUpBusy(true);
    try {
      const b64: string = await new Promise((res, rej) => {
        const rd = new FileReader();
        rd.onload = () => res(rd.result as string);
        rd.onerror = rej;
        rd.readAsDataURL(file);
      });
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: b64, folder: "bonbon" }),
      });
      const d = await r.json();
      if (r.ok && d.url) onPatch({ ph: d.url });
      else alert(d.error || "Upload failed");
    } catch {
      alert("Upload failed — please try again.");
    }
    setUpBusy(false);
  }

  const soldOut = !it.available;
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: "12px 14px",
        opacity: it.hidden ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>
            {it.name}
            {soldOut && <span style={{ ...pill, background: "#fbe9e7", color: C.warn }}>Sold out</span>}
            {!!it.hidden && <span style={{ ...pill, background: "#eee", color: "#777" }}>Hidden</span>}
          </div>
          <div style={{ fontSize: 13, color: C.mut, marginTop: 2 }}>
            ₹{it.price}
            {it.price500 ? ` · 500ml ₹${it.price500}` : ""}
            {it.q ? ` · ${it.q}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onEdit} style={smallBtn}>
            {editing ? "Close" : "Edit"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
        <Toggle on={!soldOut} label={soldOut ? "Mark available" : "In stock"} color={C.good} onClick={() => onPatch({ available: (soldOut ? 1 : 0) as 0 | 1 })} />
        <Toggle on={!!it.best} label="Best seller" color={C.maroon} onClick={() => onPatch({ best: (it.best ? 0 : 1) as 0 | 1 })} />
        <Toggle on={!!it.must} label="Must try" color="#a83048" onClick={() => onPatch({ must: (it.must ? 0 : 1) as 0 | 1 })} />
        <Toggle on={!!it.hidden} label={it.hidden ? "Hidden" : "Hide"} color="#555" onClick={() => onPatch({ hidden: (it.hidden ? 0 : 1) as 0 | 1 })} />
      </div>

      {editing && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12, display: "grid", gap: 8 }}>
          <label style={lbl}>Name</label>
          <input style={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Price ₹</label>
              <input style={inp} type="number" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} />
            </div>
            {it.cat === "sundae" && (
              <div style={{ flex: 1 }}>
                <label style={lbl}>500 ml ₹</label>
                <input style={inp} type="number" value={f.price500} onChange={(e) => setF({ ...f, price500: Number(e.target.value) })} />
              </div>
            )}
            <div style={{ width: 110 }}>
              <label style={lbl}>Quantity</label>
              <input style={inp} value={f.q} placeholder="e.g. 250 ml" onChange={(e) => setF({ ...f, q: e.target.value })} />
            </div>
          </div>
          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, minHeight: 54, resize: "vertical" }} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} />

          <label style={lbl}>Photo</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {it.ph ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.ph} alt={it.name} style={{ width: 56, height: 56, borderRadius: 9, objectFit: "cover", border: `1px solid ${C.line}`, flex: "0 0 56px" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 9, background: "#f3e7e6", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.mut, fontSize: 10.5, textAlign: "center", flex: "0 0 56px" }}>No photo</div>
            )}
            <label style={{ ...smallBtn, cursor: upBusy ? "default" : "pointer", opacity: upBusy ? 0.6 : 1 }}>
              {upBusy ? "Uploading…" : it.ph ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" disabled={upBusy} style={{ display: "none" }} onChange={onPhoto} />
            </label>
            {it.ph && !upBusy && (
              <button onClick={() => onPatch({ ph: "" })} style={{ ...smallBtn, color: C.warn, borderColor: "#f2c9c4" }}>
                Remove
              </button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <button onClick={onDelete} style={{ ...smallBtn, color: C.warn, borderColor: "#f2c9c4" }}>
              Delete
            </button>
            <button
              onClick={() => {
                onPatch({ name: f.name, price: f.price, price500: f.price500 || undefined, q: f.q, pt: f.pt, desc: f.desc });
                onSave();
              }}
              style={primaryBtn}
            >
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddModal({ onClose, onDone, defaultCat, outlet }: { onClose: () => void; onDone: () => void; defaultCat: string; outlet: string }) {
  const [f, setF] = useState({ name: "", price: "", cat: defaultCat, price500: "", q: "", desc: "", best: false, must: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setErr("");
    setBusy(true);
    const r = await fetch("/api/bonbon/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, outlet }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error || "Could not add");
    onDone();
  }
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 12 }}>Add a menu item</div>
        <label style={lbl}>Name</label>
        <input style={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Mango Sorbet" />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Category</label>
            <select style={inp} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
              {catOrder.map((c) => (
                <option key={c} value={c}>
                  {catLabels[c]}
                </option>
              ))}
            </select>
          </div>
          <div style={{ width: 100 }}>
            <label style={lbl}>Price ₹</label>
            <input style={inp} type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          </div>
          {f.cat === "sundae" && (
            <div style={{ width: 100 }}>
              <label style={lbl}>500 ml ₹</label>
              <input style={inp} type="number" value={f.price500} onChange={(e) => setF({ ...f, price500: e.target.value })} />
            </div>
          )}
        </div>
        <label style={{ ...lbl, marginTop: 8 }}>Description (optional)</label>
        <textarea style={{ ...inp, minHeight: 50, resize: "vertical" }} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Toggle on={f.best} label="Best seller" color={C.maroon} onClick={() => setF({ ...f, best: !f.best })} />
          <Toggle on={f.must} label="Must try" color="#a83048" onClick={() => setF({ ...f, must: !f.must })} />
        </div>
        {err && <div style={{ color: C.warn, fontSize: 13, marginTop: 10 }}>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={smallBtn}>
            Cancel
          </button>
          <button onClick={save} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
            {busy ? "Adding…" : "Add item"}
          </button>
        </div>
      </div>
    </div>
  );
}

const pill: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, padding: "2px 7px", borderRadius: 8, marginLeft: 8, verticalAlign: "middle" };
const lbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: C.mut, textTransform: "uppercase", letterSpacing: 0.4 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 14, outline: "none", color: C.ink, background: "#fff", marginTop: 3 };
const primaryBtn: React.CSSProperties = { padding: "9px 15px", border: 0, borderRadius: 10, background: `linear-gradient(135deg,${C.maroon},${C.dark})`, color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: "pointer" };
const smallBtn: React.CSSProperties = { padding: "7px 12px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 700, fontSize: 13, cursor: "pointer" };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(30,10,15,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 };
const modal: React.CSSProperties = { width: "100%", maxWidth: 440, background: C.card, borderRadius: 18, padding: 22, maxHeight: "90vh", overflowY: "auto" };
