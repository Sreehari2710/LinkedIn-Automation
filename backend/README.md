# LinkedIn Automation Backend

A robust Node.js/Express backend for automating LinkedIn scraping jobs via Apify.

## Features
- **Dynamic Scheduler**: Schedule daily scraping jobs at any time (persisted in DB).
- **Keyword Management**: Add/Delete keywords that you want to target.
- **Scrape History**: Track every job session, its status, and results.
- **Apify Integration**: Triggers asynchronous actor runs and polls for results.
- **Export System**: Generate CSV files for scraped data.
- **Remote Stop**: Abort running Apify jobs directly from the dashboard.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Raw SQL via `pg` pool)
- **Scheduling**: `node-cron`
- **Language**: TypeScript

## Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgres_url
   APIFY_TOKEN=your_apify_api_token
   PORT=5000
   ```
3. **Database Setup**:
   The app automatically creates the necessary tables (`Keywords`, `ScrapedPost`, `ScrapeJob`, `Settings`) on startup.
4. **Build & Start**:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints
- `GET /api/keywords`: Fetch all target keywords.
- `POST /api/keywords`: Add a new keyword.
- `DELETE /api/keywords/:id`: Remove a keyword.
- `GET /api/jobs/scheduled-time`: Get current schedule & pause status.
- `POST /api/jobs/schedule`: Update daily scrape time.
- `POST /api/jobs/schedule/toggle`: Pause or Resume the scheduler.
- `POST /api/jobs/trigger`: Trigger an immediate scrape for a keyword.
- `POST /api/jobs/stop/:id`: Stop a running scrape job.
- `GET /api/jobs/history`: Fetch list of all scrape sessions.
- `GET /api/results/job/:id`: Fetch results for a specific session.
- `GET /api/results/download/:jobId`: Download CSV for a session.
