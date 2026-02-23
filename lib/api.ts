const raw = process.env.NEXT_PUBLIC_API_URL;
if (!raw || String(raw).trim() === "") {
  throw new Error("NEXT_PUBLIC_API_URL is required. Set it in .env.local or your deployment environment. Do not default to localhost in production.");
}
export const API_BASE = String(raw).trim();
