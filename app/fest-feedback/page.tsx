import Link from "next/link";
import { requireBB } from "@/lib/bonbon";
import { listFeedback, summarise, type Feedback } from "@/lib/festFeedback";

// Guest feedback from the three fest stalls.
//
// Server component: the gate runs on the server before a single byte of feedback is
// serialised into the page. An unauthenticated visitor gets the sign-in prompt and
// nothing else — there is no client-side "hide the div" to defeat, and no API call
// they could replay, because /api/fest/feedback's GET is admin-only too.
export const dynamic = "force-dynamic";

export default async function FestFeedbackPage() {
  const session = await requireBB(["admin"]);
  if (!session) return <Locked />;

  let rows: Feedback[] = [];
  let failed = false;
  try {
    rows = await listFeedback();
  } catch {
    failed = true;
  }
  const s = summarise(rows);

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.head}>
          <h1 style={S.h1}>Stall feedback</h1>
          <p style={S.sub}>What guests said at the VIT pop-up.</p>
        </header>

        {failed && <p style={S.err}>Could not reach the database. Refresh to try again.</p>}

        <section style={S.cards}>
          <Stat label="Responses" value={String(s.total)} />
          <Stat label="Food" value={s.total ? `${s.food} / 5` : "—"} />
          <Stat label="App" value={s.total ? `${s.app} / 5` : "—"} />
          <Stat label="With a comment" value={String(s.withComment)} />
        </section>

        {s.byStall.length > 0 && (
          <section style={S.byStall}>
            {s.byStall.map((b) => (
              <div key={b.stall} style={S.stallRow}>
                <strong style={S.stallName}>{b.name}</strong>
                <span style={S.stallMeta}>
                  {b.n} {b.n === 1 ? "response" : "responses"} · food {b.food} · app {b.app}
                </span>
              </div>
            ))}
          </section>
        )}

        {rows.length === 0 && !failed && <p style={S.empty}>No feedback yet.</p>}

        <ul style={S.list}>
          {rows.map((r) => (
            <li key={r.id} style={S.item}>
              <div style={S.itemTop}>
                <strong style={S.itemStall}>{r.stallName || r.stall}</strong>
                <time style={S.time} dateTime={r.created_at}>
                  {fmt(r.created_at)}
                </time>
              </div>
              <div style={S.ratings}>
                <Rating label="Food" n={r.food} />
                <Rating label="App" n={r.app} />
              </div>
              {/* React escapes this — a comment containing markup renders as text */}
              {r.comment && <p style={S.comment}>{r.comment}</p>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function Locked() {
  return (
    <main style={S.page}>
      <div style={{ ...S.wrap, maxWidth: 380, paddingTop: 80 }}>
        <h1 style={S.h1}>Stall feedback</h1>
        <p style={{ ...S.sub, marginBottom: 22 }}>Sign in as the owner to read guest feedback.</p>
        <Link href="/bon-bon/login" style={S.btn}>
          Sign in
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.card}>
      <span style={S.cardV}>{value}</span>
      <span style={S.cardL}>{label}</span>
    </div>
  );
}

function Rating({ label, n }: { label: string; n: number }) {
  return (
    <span style={S.rating}>
      <span style={S.ratingL}>{label}</span>
      <span style={S.stars} aria-label={`${n} out of 5`}>
        {"★".repeat(Math.max(0, Math.min(5, n)))}
        <span style={S.starOff}>{"★".repeat(Math.max(0, 5 - n))}</span>
      </span>
    </span>
  );
}

function fmt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", background: "#0b0b0c", color: "#f1f1f1", padding: "28px 16px 60px",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  },
  wrap: { maxWidth: 720, margin: "0 auto" },
  head: { marginBottom: 20 },
  h1: { fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", margin: 0 },
  sub: { fontSize: 14, color: "#9d9d9d", margin: "6px 0 0" },
  err: { fontSize: 13, color: "#e2857f", margin: "0 0 16px" },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 16 },
  card: {
    background: "#151517", border: "1px solid #242427", borderRadius: 14,
    padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4,
  },
  cardV: { fontSize: 22, fontWeight: 800 },
  cardL: { fontSize: 12, color: "#8f8f95", fontWeight: 600 },
  byStall: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 },
  stallRow: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
    padding: "10px 14px", background: "#131315", border: "1px solid #212124", borderRadius: 12,
  },
  stallName: { fontSize: 14, fontWeight: 700 },
  stallMeta: { fontSize: 12.5, color: "#8f8f95" },
  empty: { fontSize: 14, color: "#8f8f95" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  item: { background: "#151517", border: "1px solid #242427", borderRadius: 14, padding: "14px 16px" },
  itemTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8 },
  itemStall: { fontSize: 14, fontWeight: 700 },
  time: { fontSize: 12, color: "#7e7e85" },
  ratings: { display: "flex", gap: 18, flexWrap: "wrap" },
  rating: { display: "flex", alignItems: "center", gap: 7 },
  ratingL: { fontSize: 12, color: "#8f8f95", fontWeight: 600 },
  stars: { fontSize: 14, color: "#ffc400", letterSpacing: 1 },
  starOff: { color: "#3a3a3d" },
  comment: {
    fontSize: 14, lineHeight: 1.5, color: "#dcdcdc", margin: "10px 0 0",
    whiteSpace: "pre-wrap", wordBreak: "break-word",
  },
  btn: {
    display: "inline-block", background: "#f1f1f1", color: "#0b0b0c", fontWeight: 700,
    fontSize: 14, padding: "11px 22px", borderRadius: 999, textDecoration: "none",
  },
};
