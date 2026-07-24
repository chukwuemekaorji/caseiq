import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let instance: Db | null = null;

// Lazy on purpose: Next.js imports every API route module at build time to
// collect page data, which would otherwise crash the build whenever
// DATABASE_URL isn't set in that environment (e.g. CI, local build without
// a .env.local). The connection is only opened on the first real query.
function getDb(): Db {
  if (!instance) {
    const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL (or POSTGRES_URL) is not set.");
    }
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
    instance = drizzle(
      new Pool({
        connectionString,
        ssl: isLocal ? undefined : { rejectUnauthorized: false },
        // Fail fast instead of hanging when the database is unreachable (offline,
        // DB down, network blip) — every route calling this must degrade gracefully,
        // not hold the request open indefinitely.
        connectionTimeoutMillis: 3000,
        query_timeout: 6000,
      }),
      { schema }
    );
  }
  return instance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
