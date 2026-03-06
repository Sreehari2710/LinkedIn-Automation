import { Pool } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config();

let pool: Pool | null = null;

const resolveIPv4 = async (url: string) => {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname;
        console.log(`Resolving IPv4 for host: ${host}`);

        const { resolve4 } = dns.promises;
        const addresses = await resolve4(host);

        if (addresses && addresses.length > 0) {
            console.log(`Resolved ${host} to ${addresses[0]}`);
            parsed.hostname = addresses[0];
            return parsed.toString();
        }

        console.log(`No IPv4 addresses found for ${host}, staying with original.`);
        return url;
    } catch (e: any) {
        console.error(`IPv4 resolution failed for host: ${new URL(url).hostname}. Error: ${e.message}`);
        return url;
    }
};

export const getPool = async (): Promise<Pool> => {
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

export const initDb = async () => {
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

    await query(`
        CREATE TABLE IF NOT EXISTS "ScrapedPost" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "keywordId" UUID REFERENCES "Keyword"(id) ON DELETE CASCADE,
            "jobId" UUID REFERENCES "ScrapeJob"(id) ON DELETE CASCADE,
            description TEXT,
            "postLink" TEXT UNIQUE,
            "datePosted" TEXT,
            "authorName" TEXT,
            "authorHeadline" TEXT,
            "authorUrl" TEXT,
            "numLikes" INTEGER DEFAULT 0,
            "numComments" INTEGER DEFAULT 0,
            "numShares" INTEGER DEFAULT 0,
            "scrapedAt" TIMESTAMP DEFAULT NOW()
        );
    `);

    // Ensure Settings table exists for production robustness
    await query(`
        CREATE TABLE IF NOT EXISTS "Settings" (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    console.log('Database tables initialized');
};
