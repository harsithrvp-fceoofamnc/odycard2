import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kfhwneotkvklisiovvnr.supabase.co";

// Server-side client — uses secret key, full database access
// Only used in API routes (server-side), never exposed to browser
export function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_KEY!;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}
