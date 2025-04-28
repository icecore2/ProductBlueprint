import { db } from "./db";
import { sql } from "drizzle-orm";

// Performs database migrations
export async function runMigrations() {
  console.log("Running database migrations...");

  try {
    // Create service_plans table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service_plans (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("✅ Migrations completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Allow running directly with Node.js
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}