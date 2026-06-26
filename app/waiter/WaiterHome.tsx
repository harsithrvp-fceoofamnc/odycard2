"use client";
import { useRouter } from "next/navigation";

export default function WaiterHome({ name }: { name: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <div style={{ minHeight: "100vh", background: "#f3efe7", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 12, letterSpacing: 1, color: "#c79233", fontWeight: 700 }}>ODYSRA · WAITER</div>
      <h1 style={{ fontSize: 24, color: "#23262b", margin: "8px 0 6px" }}>Hi {name} 👋</h1>
      <p style={{ color: "#6b7280", fontSize: 14.5, maxWidth: 320, lineHeight: 1.5 }}>
        You&apos;re logged in. Ready-order alerts for your tables will appear here once order tracking goes live for your branch.
      </p>
      <button onClick={logout} style={{ marginTop: 22, padding: "11px 20px", borderRadius: 11, border: "1.5px solid #d9d3c7", background: "#fff", color: "#5c3a1c", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Log out
      </button>
    </div>
  );
}
