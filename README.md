# LinkedIn Automation Scraper

This repository contains a Next.js frontend dashboard and Node.js backend to schedule, manage, and extract LinkedIn post data using the Apify `supreme_coder/linkedin-post` Actor.

## Prerequisites

Before running the application, you must have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [PostgreSQL](https://www.postgresql.org/) (Running locally or hosted via Supabase/Render/etc.)
- An [Apify API Key](https://apify.com/) mapped to the `supreme_coder/linkedin-post` actor (Hardcoded into backend/src/scraper/index.ts).

## 1. Setting up the Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd "backend"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Environment Variables:
   - Rename `backend/.env.example` to `backend/.env`
   - Paste your PostgreSQL Connection string into `DATABASE_URL`.
   - **Example format:** `postgresql://postgres:password@localhost:5432/linkedin_scraper?schema=public`

4. Initialize the Database Schema:
   ```bash
   npx prisma db push
   ```
   *(This creates the `Keyword` and `ScrapedPost` tables in your Postgres database).*

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5000` and automatically schedule a daily scrape every day at 8:00 AM server time.*

---

## 2. Setting up the Frontend

1. Open a new terminal instance and navigate to the `frontend/` directory:
   ```bash
   cd "frontend"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Evaluate Environment Variables:
   - The frontend connects to `http://localhost:5000/api` by default. If your backend is hosted elsewhere, rename `.env.example` to `.env` and override `NEXT_PUBLIC_API_URL`.

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The dashboard will run on `http://localhost:3000`.*

---

## 3. How to Use the App

1. Go to `http://localhost:3000` in your web browser.
2. Under "Add New Keyword", fill out the filters you want Apify to use:
   - **Keyword:** (e.g., `autodm` or `software engineer`)
   - **Time Filter:** (`Past 24 Hours`, `Past Week`, or `Past Month`)
   - **Sort By:** (`Top Match` or `Latest`)
   - **Amount:** `10` (Max 100 per job run).
3. Click "Add Keyword". It will appear in your Active Keywords list.
4. **Scraping:**
   - The backend cron job (`node-cron`) will automatically scrape all your **Active Keywords** every single day at **8:00 AM**.
   - You can also force a scrape immediately by clicking the **"Trigger Scrape Now"** button at the top of the UI.
5. **Viewing Data:**
   - Results are automatically injected into your Postgres Database.
   - At the end of every scrape cycle, a CSV is generated dynamically containing the new data and stored in the `backend/exports/` folder locally.
