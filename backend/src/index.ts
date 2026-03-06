import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initScheduler } from './services/scheduler';
import keywordRoutes from './routes/keywords';
import jobRoutes from './routes/jobs';
import resultsRoutes from './routes/results';

import { initDb } from './db';

dotenv.config();

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

app.use('/api/keywords', keywordRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/results', resultsRoutes);

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
