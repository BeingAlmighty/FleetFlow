import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https', 'postgres').replace('.supabase.co', '') + '?sslmode=require'; 
// Note: Normally Drizzle connects via a direct DB connection string (postgres://postgres:password@host:5432/postgres), not the REST API URL.
// We will mock this or use the direct Supabase DB string if provided in env later.

const client = postgres(process.env.DATABASE_URL || 'postgres://placeholder:5432/db');
export const db = drizzle(client, { schema });
