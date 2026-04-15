import { Pool } from "pg";

// Global pool — reused across warm serverless invocations
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: "aws-1-ap-south-1.pooler.supabase.com",
      port: 5432,
      database: "postgres",
      user: "postgres.kfhwneotkvklisiovvnr",
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 3, // keep low for serverless
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    });
    pool.on("error", () => { pool = null; }); // reset on error so next call creates fresh
  }
  return pool;
}
