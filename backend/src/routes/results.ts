import { Router, Request, Response } from 'express';
import { query } from '../db';
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

export default router;
