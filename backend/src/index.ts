import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import { initScheduler } from './services/scheduler';
import keywordRoutes from './routes/keywords';
import jobRoutes from './routes/jobs';
import resultsRoutes from './routes/results';
import { initDb, query } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database and Scheduler
(async () => {
    try {
        await initDb();
        await initScheduler();
    } catch (err) {
        console.error('Initialization failed:', err);
    }
})();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('LinkedIn Automation API is running 🚀');
});

// Debug endpoint to check DB connection
app.get('/api/debug', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({
            status: 'connected',
            time: result.rows[0].now,
            env: {
                has_db_url: !!process.env.DATABASE_URL,
                node_env: process.env.NODE_ENV
            }
        });
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: err.message,
            code: err.code,
            stack: err.stack,
            detail: err.detail
        });
    }
});

app.use('/api/keywords', keywordRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/results', resultsRoutes);

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
