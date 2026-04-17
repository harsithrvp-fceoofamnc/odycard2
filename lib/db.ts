import { Pool } from "pg";

// Global pool — reused across warm serverless invocations
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      // Transaction Pooler — port 6543, designed for serverless functions
      host: "aws-1-ap-south-1.pooler.supabase.com",
      port: 6543,
      database: "postgres",
      user: "postgres.kfhwneotkvklisiovvnr",
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", () => { pool = null; });
  }
  return pool;
}
