import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initScheduler } from './services/scheduler';
import keywordRoutes from './routes/keywords';
import jobRoutes from './routes/jobs';
import resultsRoutes from './routes/results';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize dynamic scheduler
initScheduler().catch(err => console.error('Failed to init scheduler:', err));

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
