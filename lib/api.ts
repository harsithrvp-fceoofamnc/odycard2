// Empty string = relative URLs hitting Next.js API routes on same domain (no external backend needed)
// Set NEXT_PUBLIC_API_URL only if you want to override with an external backend
const raw = process.env.NEXT_PUBLIC_API_URL;
export const API_BASE = raw && String(raw).trim() !== "" ? String(raw).trim() : "";
