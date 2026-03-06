import { startScrapingJob } from '../scraper/index';
import { query } from '../db';

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

export const updateSchedule = async (time: string) => {
    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
    if (!timeRegex.test(time)) {
        throw new Error('Invalid time format. Use HH:mm');
    }

    scheduledTime = time;
    await query('UPDATE "Settings" SET value = $1 WHERE key = $2', [scheduledTime, 'scheduledTime']);
    console.log(`Daily scrape preference updated to ${time}.`);
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
    } catch (error) {
        console.error('Failed to initialize scheduler settings:', error);
    }
};

/**
 * This function will be called by the Netlify Scheduled Function (every hour).
 * It checks the database to see if it SHOULD run (not paused AND the hour matches).
 */
export const runScheduledTask = async () => {
    await initScheduler();

    if (isPaused) {
        console.log('Scheduled task skipped: Scheduler is PAUSED in settings.');
        return;
    }

    // Get current hour in UTC or local (Supabase/Server time)
    // We'll compare just the "Hour" portion for simplicity in the hourly cron.
    const currentHour = new Date().getHours();
    const [scheduledHour] = scheduledTime.split(':').map(Number);

    if (currentHour !== scheduledHour) {
        console.log(`Scheduled task skipped: Current hour (${currentHour}) does not match scheduled hour (${scheduledHour}).`);
        return;
    }

    console.log(`Executing scheduled scraping job (Target: ${scheduledTime})...`);
    try {
        await startScrapingJob();
        console.log('Scheduled scraping job completed successfully.');
    } catch (error) {
        console.error('Error during scheduled scraping job:', error);
        throw error;
    }
};
