import { NextResponse } from "next/server";

// Returns the Sarvam key to the browser for REAL-TIME streaming (browser opens the WebSocket directly,
// because WebSockets can't send auth headers, and Vercel can't proxy a live socket).
// This route sits behind the access-code gate (middleware requires the ody_gate cookie for /api/stt*),
// so only someone who entered the password can fetch it. NOTE: that means anyone with the password can
// read the key in their browser — acceptable for a gated demo; rotate the free key before public launch.
export async function GET() {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  return NextResponse.json({ key });
}
