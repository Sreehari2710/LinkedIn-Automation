import { Router, Request, Response } from 'express';
import { query } from '../db';
import { analyzeLead } from '../services/geminiService';
import path from 'path';
import fs from 'fs';

const router = Router();

// Get the latest scraped posts
router.get('/', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const result = await query(`
      SELECT p.*, k.term 
      FROM "ScrapedPost" p
      JOIN "Keyword" k ON p."keywordId" = k.id
      ORDER BY p."scrapedAt" DESC
      LIMIT $1
    `, [limit]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Download the latest CSV
router.get('/download', (req: Request, res: Response) => {
    try {
        const exportsDir = path.join(__dirname, '../../exports');

        if (!fs.existsSync(exportsDir)) {
            return res.status(404).json({ error: 'No exports found' });
        }

        const files = fs.readdirSync(exportsDir)
            .filter(f => f.endsWith('.csv'))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(exportsDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length === 0) {
            return res.status(404).json({ error: 'No CSV files available' });
        }

        const latestFile = path.join(exportsDir, files[0].name);
        res.download(latestFile);
    } catch (error) {
        console.error('Error downloading CSV:', error);
        res.status(500).json({ error: 'Failed to download CSV' });
    }
});

// Get posts for a specific job
router.get('/job/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await query('SELECT * FROM "ScrapedPost" WHERE "jobId" = $1 ORDER BY "scrapedAt" DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job results' });
    }
});

// Analyze a specific lead
router.post('/analyze/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`Backend: Received analysis request for post ID: ${id}`);
    try {
        const postResult = await query(`
            SELECT p.*, k.term 
            FROM "ScrapedPost" p
            LEFT JOIN "Keyword" k ON p."keywordId" = k.id
            WHERE p.id = $1
        `, [id]);

        if (postResult.rows.length === 0) {
            console.error(`Backend: Post with ID ${id} not found in database.`);
            return res.status(404).json({ error: 'Post not found' });
        }

        const post = postResult.rows[0];
        const analysis = await analyzeLead(post.description || "", post.authorHeadline || "", post.term || "General");

        await query(
            'UPDATE "ScrapedPost" SET "qualityScore" = $1, "qualityReason" = $2, "isQualified" = $3 WHERE id = $4',
            [analysis.qualityScore, analysis.qualityReason, analysis.isQualified, id]
        );

        res.json({ id, ...analysis });
    } catch (error) {
        console.error('Error in /analyze/:id:', error);
        res.status(500).json({ error: 'Failed to analyze lead' });
    }
});

router.post('/analyze-job/:jobId', async (req: Request, res: Response) => {
    const { jobId } = req.params;
    console.log(`Backend: Received bulk analysis request for job ID: ${jobId}`);
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const postsResult = await query(`
            SELECT p.*, k.term 
            FROM "ScrapedPost" p
            LEFT JOIN "Keyword" k ON p."keywordId" = k.id
            WHERE p."jobId" = $1 AND p."qualityScore" IS NULL
        `, [jobId]);

        const posts = postsResult.rows;

        const results = [];
        for (const post of posts) {
            // Add a small 2-second delay to avoid hitting rate limits (15 RPM)
            console.log(`Bulk Analysis: Processing ${post.authorName}... (Waiting 2s)`);
            await sleep(2000);

            const analysis = await analyzeLead(post.description || "", post.authorHeadline || "", post.term || "General");
            await query(
                'UPDATE "ScrapedPost" SET "qualityScore" = $1, "qualityReason" = $2, "isQualified" = $3 WHERE id = $4',
                [analysis.qualityScore, analysis.qualityReason, analysis.isQualified, post.id]
            );
            results.push({ id: post.id, ...analysis });
        }

        res.json({ count: results.length, results });
    } catch (error) {
        console.error('Error in /analyze-job/:jobId:', error);
        res.status(500).json({ error: 'Failed to bulk analyze leads' });
    }
});

export default router;
