import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

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
