import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy initialization - only create connection when db is first accessed
let _db: PostgresJsDatabase<typeof schema> | null = null;
let _queryClient: ReturnType<typeof postgres> | null = null;

function getDbInstance(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Configure connection pool for production workloads
  _queryClient = postgres(connectionString, {
    max: parseInt(process.env.DB_POOL_MAX || "10", 10), // Max 10 connections
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // Timeout connection attempts after 10s
    max_lifetime: 60 * 30, // Recycle connections after 30 minutes
  });

  // Drizzle instance
  _db = drizzle(_queryClient, { schema });
  return _db;
}

// Export db as a getter that initializes on first access
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_, prop) {
    const instance = getDbInstance();
    const value = instance[prop as keyof typeof instance];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

// Export schema for use in other packages
export * from "./schema";
export type { schema };

// Export Redis client and utilities
export {
  redis,
  createRedisConnection,
  checkRedisHealth,
  getRedisInfo,
  closeRedisConnection,
} from "./redis";
export type { Redis } from "./redis";