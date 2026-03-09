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

        // Skip resolution if it's already an IP
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return url;

        console.log(`Resolving IPv4 for host: ${host}`);

        try {
            const { resolve4 } = dns.promises;
            const addresses = await resolve4(host);

            if (addresses && addresses.length > 0) {
                console.log(`Resolved ${host} to IPv4: ${addresses[0]}`);
                parsed.hostname = addresses[0];
                return parsed.toString();
            }
        } catch (dnsErr: any) {
            console.warn(`DNS resolve4 failed for ${host}: ${dnsErr.message}. Trying dns.lookup...`);
            const { lookup } = dns.promises;
            const result = await lookup(host, { family: 4 });
            if (result.address) {
                console.log(`Lookup ${host} to IPv4: ${result.address}`);
                parsed.hostname = result.address;
                return parsed.toString();
            }
        }

        console.log(`No IPv4 addresses found for ${host}, staying with original.`);
        return url;
    } catch (e: any) {
        console.error(`IPv4 resolution failed. Error: ${e.message}`);
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
            "keywordId" UUID REFERENCES "Keyword"(id) ON DELETE SET NULL,
            term TEXT,
            status TEXT DEFAULT 'PENDING',
            "startedAt" TIMESTAMP DEFAULT NOW(),
            "finishedAt" TIMESTAMP,
            "apifyRunId" TEXT,
            "itemCount" INTEGER DEFAULT 0
        );
    `);

    // Migrate existing table if necessary
    try {
        await query('ALTER TABLE "ScrapeJob" ADD COLUMN IF NOT EXISTS "term" TEXT');
        // Update constraint to SET NULL for ScrapeJob
        await query(`
            ALTER TABLE "ScrapeJob" 
            DROP CONSTRAINT IF EXISTS "ScrapeJob_keywordId_fkey",
            ADD CONSTRAINT "ScrapeJob_keywordId_fkey" 
            FOREIGN KEY ("keywordId") REFERENCES "Keyword"(id) ON DELETE SET NULL
        `);
    } catch (e) {
        console.log('Migration for ScrapeJob skipped or failed:', e);
    }

    await query(`
        CREATE TABLE IF NOT EXISTS "ScrapedPost" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "keywordId" UUID REFERENCES "Keyword"(id) ON DELETE SET NULL,
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
            "qualityScore" INTEGER,
            "qualityReason" TEXT,
            "isQualified" BOOLEAN,
            "scrapedAt" TIMESTAMP DEFAULT NOW()
        );
    `);

    // Migrate existing table if necessary
    try {
        await query(`
            ALTER TABLE "ScrapedPost" 
            DROP CONSTRAINT IF EXISTS "ScrapedPost_keywordId_fkey",
            ADD CONSTRAINT "ScrapedPost_keywordId_fkey" 
            FOREIGN KEY ("keywordId") REFERENCES "Keyword"(id) ON DELETE SET NULL
        `);
        // Add quality columns if they don't exist
        await query('ALTER TABLE "ScrapedPost" ADD COLUMN IF NOT EXISTS "qualityScore" INTEGER');
        await query('ALTER TABLE "ScrapedPost" ADD COLUMN IF NOT EXISTS "qualityReason" TEXT');
        await query('ALTER TABLE "ScrapedPost" ADD COLUMN IF NOT EXISTS "isQualified" BOOLEAN');
    } catch (e) {
        console.log('Migration for ScrapedPost skipped or failed:', e);
    }

    // Ensure Settings table exists for production robustness
    await query(`
        CREATE TABLE IF NOT EXISTS "Settings" (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    console.log('Database tables initialized');
};
