import { query } from '../db';
import { exportDailyCSV } from '../services/exportService';
import axios from 'axios';

// The endpoint provided by the user that runs synchronously and returns items
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_RUN_URL = `https://api.apify.com/v2/acts/supreme_coder~linkedin-post/runs?token=${APIFY_TOKEN}`;

export const startScrapingJob = async () => {
    console.log('Starting Scrape Session...');

    try {
        const keywordResult = await query('SELECT * FROM "Keyword" WHERE "isActive" = true');
        const activeKeywords = keywordResult.rows;

        if (activeKeywords.length === 0) {
            console.log('No active keywords found.');
            return;
        }

        for (const keyword of activeKeywords) {
            console.log(`Creating Job for: ${keyword.term}`);

            // 1. Create ScrapeJob record
            const jobResult = await query(
                'INSERT INTO "ScrapeJob" ("keywordId", "status", "term") VALUES ($1, $2, $3) RETURNING id',
                [keyword.id, 'RUNNING', keyword.term]
            );
            const jobId = jobResult.rows[0].id;

            const encodedKeyword = encodeURIComponent(keyword.term);
            const sortParam = keyword.sortBy === 'latest' ? 'sortBy="date"' : '';
            let timeParam = '';
            if (keyword.timeFilter === 'past-24h') timeParam = 'datePosted="past-24h"';
            else if (keyword.timeFilter === 'past-week') timeParam = 'datePosted="past-week"';
            else if (keyword.timeFilter === 'past-month') timeParam = 'datePosted="past-month"';

            const queryParams = [`keywords=${encodedKeyword}`, 'origin=SWITCH_SEARCH_VERTICAL'];
            if (sortParam) queryParams.push(sortParam);
            if (timeParam) queryParams.push(timeParam);

            if (keyword.timeFilter === 'past-6-months') queryParams.push('datePosted="past-6-months"');
            else if (keyword.timeFilter === 'past-year') queryParams.push('datePosted="past-year"');

            const searchUrl = `https://www.linkedin.com/search/results/content/?${queryParams.join('&')}`;

            // If directUrl is provided, use it instead of the generated search URL
            const targetUrl = keyword.directUrl && keyword.directUrl.trim() !== ''
                ? keyword.directUrl.trim()
                : searchUrl;

            const payload = {
                "deepScrape": true,
                "limitPerSource": keyword.limit || 10,
                "urls": [targetUrl]
            };

            try {
                // 2. Trigger Apify Run Asynchronously
                const runRes = await axios.post(APIFY_RUN_URL, payload);
                const runId = runRes.data.data.id;
                const datasetId = runRes.data.data.defaultDatasetId;

                await query('UPDATE "ScrapeJob" SET "apifyRunId" = $1 WHERE id = $2', [runId, jobId]);

                // 3. Poll for completion in background (simplified for this context)
                monitorRun(runId, datasetId, jobId).catch(console.error);

            } catch (err: any) {
                console.error(`Trigger failed for ${keyword.term}:`, err.message);
                await query('UPDATE "ScrapeJob" SET "status" = $1 WHERE id = $2', ['FAILED', jobId]);
            }
        }
    } catch (error) {
        console.error('Execution error:', error);
    }
};

const monitorRun = async (runId: string, datasetId: string, jobId: string) => {
    const STATUS_URL = `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`;
    const DATASET_URL = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;

    let finished = false;
    let attempts = 0;

    while (!finished && attempts < 60) { // Max 10 mins (10s * 60)
        attempts++;
        await new Promise(r => setTimeout(r, 10000));

        const statusRes = await axios.get(STATUS_URL);
        const status = statusRes.data.data.status;

        if (status === 'SUCCEEDED') {
            finished = true;
            const itemsRes = await axios.get(DATASET_URL);
            const items = itemsRes.data;

            if (Array.isArray(items)) {
                for (const item of items) {
                    if (!item.url) continue;
                    const sql = `
                        INSERT INTO "ScrapedPost" 
                        ("keywordId", "jobId", description, "postLink", "datePosted", "authorName", "authorHeadline", "authorUrl", "numLikes", "numComments", "numShares")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT ("postLink") DO UPDATE SET
                          "jobId" = EXCLUDED."jobId",
                          description = EXCLUDED.description,
                          "numLikes" = EXCLUDED."numLikes",
                          "numComments" = EXCLUDED."numComments",
                          "scrapedAt" = NOW()
                    `;
                    const values = [
                        item.keywordId || (await query('SELECT "keywordId" FROM "ScrapeJob" WHERE id = $1', [jobId])).rows[0].keywordId,
                        jobId,
                        item.text || '',
                        item.url,
                        item.postedAtISO || item.timeSincePosted || '',
                        item.authorName || '',
                        item.authorHeadline || '',
                        item.authorProfileUrl || '',
                        item.numLikes || 0,
                        item.numComments || 0,
                        item.numShares || 0
                    ];
                    await query(sql, values);
                }
                await query(
                    'UPDATE "ScrapeJob" SET "status" = $1, "finishedAt" = NOW(), "itemCount" = $2 WHERE id = $3',
                    ['COMPLETED', items.length, jobId]
                );
            }
        } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
            finished = true;
            await query('UPDATE "ScrapeJob" SET "status" = $1 WHERE id = $2', [status, jobId]);
        }
    }

    if (!finished) {
        await query('UPDATE "ScrapeJob" SET "status" = $1 WHERE id = $2', ['TIMED-OUT', jobId]);
    }
};
