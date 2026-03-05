import cron, { ScheduledTask } from 'node-cron';
import { startScrapingJob } from '../scraper/index';
import { query } from '../db';

let currentJob: ScheduledTask | null = null;
let scheduledTime: string = '08:00'; // Default to 8 AM
let isPaused: boolean = false;

export const getScheduledTime = () => scheduledTime;
export const getIsPaused = () => isPaused;

const ensureSettingsTable = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS "Settings" (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);
    // Seed default values if missing
    await query(`INSERT INTO "Settings" (key, value) VALUES ('scheduledTime', '08:00') ON CONFLICT (key) DO NOTHING`);
    await query(`INSERT INTO "Settings" (key, value) VALUES ('isPaused', 'false') ON CONFLICT (key) DO NOTHING`);
};

export const togglePause = async (paused: boolean) => {
    isPaused = paused;
    console.log(`Scheduler ${isPaused ? 'PAUSED' : 'RESUMED'}`);
    await query('UPDATE "Settings" SET value = $1 WHERE key = $2', [isPaused.toString(), 'isPaused']);
    return isPaused;
};

export const scheduleJob = async (time: string) => {
    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
    if (!timeRegex.test(time)) {
        throw new Error('Invalid time format. Use HH:mm');
    }

    const [hours, minutes] = time.split(':');
    const cronExpression = `${minutes} ${hours} * * *`;

    if (currentJob) {
        currentJob.stop();
    }

    scheduledTime = time;
    await query('UPDATE "Settings" SET value = $1 WHERE key = $2', [scheduledTime, 'scheduledTime']);

    currentJob = cron.schedule(cronExpression, async () => {
        if (isPaused) {
            console.log('Scraping job skipped because scheduler is PAUSED.');
            return;
        }
        console.log(`Running scheduled scraping job at ${time}...`);
        try {
            await startScrapingJob();
            console.log('Scheduled scraping job completed successfully.');
        } catch (error) {
            console.error('Error during scheduled scraping job:', error);
        }
    });

    console.log(`Scraping job scheduled for ${time} daily.`);
    return true;
};

export const initScheduler = async () => {
    try {
        await ensureSettingsTable();

        // Load settings from DB
        const timeRes = await query('SELECT value FROM "Settings" WHERE key = $1', ['scheduledTime']);
        const pauseRes = await query('SELECT value FROM "Settings" WHERE key = $1', ['isPaused']);

        if (timeRes.rows.length > 0) scheduledTime = timeRes.rows[0].value;
        if (pauseRes.rows.length > 0) isPaused = pauseRes.rows[0].value === 'true';

        console.log(`Loaded settings: Time=${scheduledTime}, Paused=${isPaused}`);
        await scheduleJob(scheduledTime);
    } catch (error) {
        console.error('Failed to initialize scheduler:', error);
    }
};
