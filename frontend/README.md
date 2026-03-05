# LinkedIn Automation Frontend

A premium, interactive dashboard for managing LinkedIn scraping automation.

## Features
- **Premium UI**: Modern light-mode design with smooth animations and glassmorphism.
- **Real-time Monitoring**: See currently running jobs and their live status.
- **Interactive Scheduling**: Precise time selection with persistent settings.
- **Keyword Dashboard**: Quick management of your scraping targets.
- **Detailed History**: Browse past scrapes and download results instantly.
- **Premium Alerts**: Custom slide-in notifications for actions.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS (CSS Modules)
- **State Management**: React Hooks (useState, useEffect)
- **Icons**: Emoji-based for lightweight performance.

## Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Update `src/utils/api.ts` if your backend URL is different from `http://localhost:5000`.
3. **Run Development Server**:
   ```bash
   npm run dev
   ```
4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## Project Structure
- `/src/app`: Main dashboard page and layout.
- `/src/components`: Reusable UI elements like `AlertCard`.
- `/src/utils`: API utility functions for backend communication.
- `/src/app/page.module.css`: Core design system and layout styles.
