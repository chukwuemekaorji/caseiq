import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations run once and don't need connection pooling — use the direct
    // connection if provided (Supabase's pooled URL doesn't reliably support
    // the session-level operations drizzle-kit needs for schema changes).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "",
  },
});
