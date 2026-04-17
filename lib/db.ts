// Deprecated — replaced by lib/supabase.ts
// Kept to avoid import errors during transition
export function getPool() {
  throw new Error("Use getSupabase() from lib/supabase.ts instead of getPool()");
}
