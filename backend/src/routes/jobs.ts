import { Router, Request, Response } from 'express';
import { query } from '../db';
import axios from 'axios';
import { scheduleJob, getScheduledTime, togglePause, getIsPaused } from '../services/scheduler';
import { startScrapingJob } from '../scraper/index';

const router = Router();
const APIFY_TOKEN = process.env.APIFY_TOKEN;

// Get scrape history
router.get('/history', async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT j.*, k.term 
            FROM "ScrapeJob" j
            JOIN "Keyword" k ON j."keywordId" = k.id
            ORDER BY j."startedAt" DESC
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Stop a running job
router.post('/stop/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const jobRes = await query('SELECT "apifyRunId" FROM "ScrapeJob" WHERE id = $1', [id]);
        if (jobRes.rows.length === 0) return res.status(404).json({ error: 'Job not found' });

        const runId = jobRes.rows[0].apifyRunId;
        if (runId) {
            await axios.post(`https://api.apify.com/v2/actor-runs/${runId}/abort?token=${APIFY_TOKEN}`);
        }

        await query('UPDATE "ScrapeJob" SET "status" = $1 WHERE id = $2', ['ABORTED', id]);
        res.json({ message: 'Job stopped successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to stop job' });
    }
});

// Get current scheduled status
router.get('/scheduled-time', (req: Request, res: Response) => {
    res.json({
        time: getScheduledTime(),
        isPaused: getIsPaused()
    });
});

// Toggle scheduler pause
router.post('/schedule/toggle', async (req: Request, res: Response) => {
    const { isPaused } = req.body;
    try {
        const status = await togglePause(isPaused);
        res.json({ message: `Scheduler ${status ? 'paused' : 'resumed'}`, isPaused: status });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update scheduled time
router.post('/schedule', async (req: Request, res: Response) => {
    const { time } = req.body;
    try {
        await scheduleJob(time);
        res.json({ message: `Successfully scheduled daily scrape for ${time}` });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Manually trigger a job
router.post('/trigger', async (req: Request, res: Response) => {
    try {
        // We start the job asynchronously so we don't block the request
        startScrapingJob().catch(console.error);
        res.json({ message: 'Scraping job started manually.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger scraping job' });
    }
});

export default router;
