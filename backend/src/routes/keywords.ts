import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// Get all keywords
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM "Keyword" ORDER BY "createdAt" DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching keywords:', error);
        res.status(500).json({ error: 'Failed to fetch keywords' });
    }
});

// Create a new keyword
router.post('/', async (req: Request, res: Response) => {
    try {
        const { term, location, timeFilter, sortBy, limit, directUrl, isActive } = req.body;
        const result = await query(
            'INSERT INTO "Keyword" (term, location, "timeFilter", "sortBy", "limit", "directUrl", "isActive") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [term, location, timeFilter, sortBy, limit, directUrl, isActive]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating keyword:', error);
        res.status(500).json({ error: 'Failed to create keyword' });
    }
});

// Update an existing keyword
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { term, location, timeFilter, sortBy, limit, directUrl, isActive } = req.body;
        const result = await query(
            'UPDATE "Keyword" SET term = $1, location = $2, "timeFilter" = $3, "sortBy" = $4, "limit" = $5, "directUrl" = $6, "isActive" = $7, "updatedAt" = NOW() WHERE id = $8 RETURNING *',
            [term, location, timeFilter, sortBy, limit, directUrl, isActive, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Keyword not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating keyword:', error);
        res.status(500).json({ error: 'Failed to update keyword' });
    }
});

// Delete a keyword
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM "Keyword" WHERE id = $1', [id]);
        res.json({ message: 'Keyword deleted' });
    } catch (error) {
        console.error('Error deleting keyword:', error);
        res.status(500).json({ error: 'Failed to delete keyword' });
    }
});

export default router;
