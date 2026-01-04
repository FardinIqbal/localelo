import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Allow build to succeed without DATABASE_URL
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://localhost:5432/localelo";

// Connection for queries
const queryClient = postgres(databaseUrl, {
  max: 1,
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
});

export const db = drizzle(queryClient, { schema });

export * from "./schema";
