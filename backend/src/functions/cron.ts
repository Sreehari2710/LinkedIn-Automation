import { runScheduledTask } from '../services/scheduler';

export const handler = async (event: any, context: any) => {
    console.log('Netlify Scheduled Function Triggered');
    try {
        await runScheduledTask();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Scheduled task executed successfully' })
        };
    } catch (error: any) {
        console.error('Scheduled task failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// This is the magic comment that Netlify uses to schedule the function.
// However, since we want a DYNAMIC time based on user settings, 
// we normally would need an external pinger. 
// BUT Netlify functions can't be rescheduled on the fly.
// WORKAROUND: We run this function every hour, and inside the function 
// we check if it's the right "Hour" to run.
export const config = {
    schedule: "0 * * * *" // Runs every hour at the top of the hour
};
