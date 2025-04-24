import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Check for database URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log database connection attempt
console.log('[db] Connecting to the database...');

// Create a connection pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 10000, // Timeout after 10s when connecting
});

// Initialize Drizzle ORM with the connection pool
export const db = drizzle(pool, { schema });

// Optional: Test the connection
pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
pool.query('SELECT NOW()', [])
  .then(() => console.log('[db] Successfully connected to the database'))
  .catch(err => console.error('[db] Error connecting to the database:', err));