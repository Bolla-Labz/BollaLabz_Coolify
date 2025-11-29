import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Connection for queries
const queryClient = postgres(connectionString);

// Drizzle instance
export const db = drizzle(queryClient, { schema });

// Export schema for use in other packages
export * from "./schema";
export type { schema };