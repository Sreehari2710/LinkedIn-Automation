import { Pool } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config();

const resolveIPv4 = async (url: string) => {
    try {
        const parsed = new URL(url);
        const lookup = promisify(dns.lookup);
        const { address } = await lookup(parsed.hostname, { family: 4 });
        parsed.hostname = address;
        return parsed.toString();
    } catch (e) {
        console.error('IPv4 resolution failed, using original URL:', e);
        return url;
    }
};

// We initialize the pool lazily or after resolution
let pool: Pool;

export const getPool = async () => {
    if (!pool) {
        const connectionString = await resolveIPv4(process.env.DATABASE_URL || '');
        pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false }
        });
    }
    return pool;
};

export const query = async (text: string, params?: any[]) => {
    const p = await getPool();
    return p.query(text, params);
};

// Exporting a getter for the pool instead of the pool itself
export { pool };

export const initDb = async () => {
    // Ensure uuid-ossp extension for gen_random_uuid() or just use gen_random_uuid() which is built-in for modern PG
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await query(`
        CREATE TABLE IF NOT EXISTS "Keyword" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            term TEXT NOT NULL,
            location TEXT,
            "timeFilter" TEXT,
            "sortBy" TEXT,
            "limit" INTEGER,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS "ScrapeJob" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "keywordId" UUID REFERENCES "Keyword"(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'PENDING',
            "startedAt" TIMESTAMP DEFAULT NOW(),
            "finishedAt" TIMESTAMP,
            "apifyRunId" TEXT,
            "itemCount" INTEGER DEFAULT 0
        );
    `);

    console.log('Database tables initialized');
};

export default pool;
