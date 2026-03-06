"use client";

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { getKeywords, createKeyword, deleteKeyword, triggerScrapeJob, getResults, downloadResults, getScheduledTime, updateScheduledTime, getScrapeHistory, stopScrapeJob, toggleSchedulePause } from '../utils/api';

type Keyword = {
  id: string;
  term: string;
  location: string;
  timeFilter: string;
  sortBy: string;
  limit: number;
  isActive: boolean;
};

type ScrapeJob = {
  id: string;
  keywordId: string;
  status: string;
  term: string;
};

type Alert = {
  message: string;
  type: 'success' | 'error' | 'info';
} | null;

export default function Home() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [runningJobs, setRunningJobs] = useState<ScrapeJob[]>([]);
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [isPaused, setIsPaused] = useState(false);
  const [alert, setAlert] = useState<Alert>(null);
  const [term, setTerm] = useState('');
  const [location, setLocation] = useState('');
  const [timeFilter, setTimeFilter] = useState('past-24h');
  const [sortBy, setSortBy] = useState('top-match');
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKeywords();
    fetchScheduledStatus();
    fetchRunningJobs();
    const interval = setInterval(fetchRunningJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchKeywords = async () => {
    try {
      const data = await getKeywords();
      setKeywords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRunningJobs = async () => {
    try {
      const data = await getScrapeHistory();
      if (Array.isArray(data)) {
        setRunningJobs(data.filter(j => j.status === 'RUNNING'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScheduledStatus = async () => {
    try {
      const data = await getScheduledTime();
      if (data.time) setScheduledTime(data.time);
      if (data.isPaused !== undefined) setIsPaused(data.isPaused);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term) return;
    setLoading(true);
    try {
      await createKeyword({ term, location, timeFilter, sortBy, limit, isActive: true });
      setTerm('');
      setLocation('');
      setTimeFilter('past-24h');
      setSortBy('top-match');
      setLimit(10);
      await fetchKeywords();
      showAlert('Keyword added successfully');
    } catch (e: any) {
      showAlert(e.message || 'Failed to add keyword', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteKeyword(id);
    await fetchKeywords();
    showAlert('Keyword deleted');
  };

  const handleTriggerScrape = async () => {
    showAlert('Scraping job started!', 'info');
    await triggerScrapeJob();
    fetchRunningJobs();
  };

  const handleStopJob = async (id: string) => {
    if (confirm('Are you sure you want to stop this scrape session?')) {
      await stopScrapeJob(id);
      showAlert('Job stopped', 'info');
      fetchRunningJobs();
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      const res = await updateScheduledTime(scheduledTime);
      showAlert(res.message || 'Schedule updated');
    } catch (e) {
      showAlert('Failed to update schedule', 'error');
    }
  };

  const handleTogglePause = async () => {
    const nextState = !isPaused;
    try {
      const res = await toggleSchedulePause(nextState);
      setIsPaused(res.isPaused);
      showAlert(res.message, 'info');
    } catch (e: any) {
      showAlert(e.message || 'Failed to toggle schedule', 'error');
    }
  };

  return (
    <main className={styles.main}>
      {alert && (
        <div className={`${styles.alertCard} ${styles[alert.type]}`}>
          <div className={styles.alertIcon}>
            {alert.type === 'success' ? '✅' : alert.type === 'error' ? '❌' : 'ℹ️'}
          </div>
          <div className={styles.alertContent}>{alert.message}</div>
          <button className={styles.alertClose} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      <header className={styles.header}>
        <h1>LinkedIn Automation</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className={styles.schedulerContainer}>
            <div className={styles.inputField} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginBottom: 0 }}>
              <label style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Daily Scrape at:</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className={styles.input}
                style={{ width: '130px', padding: '0.5rem 0.75rem', fontSize: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}
              />
              <button className={styles.exportButton} onClick={handleUpdateSchedule} style={{ padding: '0.625rem 1rem' }}>
                Update
              </button>
            </div>
            <button
              className={`${styles.pauseButton} ${isPaused ? styles.resumed : styles.paused}`}
              onClick={handleTogglePause}
            >
              {isPaused ? '▶ Resume Schedule' : '⏸ Pause Schedule'}
            </button>
          </div>

          <button
            className={styles.primaryButton}
            onClick={handleTriggerScrape}
            disabled={loading || runningJobs.length > 0}
          >
            {runningJobs.length > 0 ? 'Scrape in Progress...' : 'Trigger Scrape Now'}
          </button>
        </div>
      </header>

      {runningJobs.length > 0 && (
        <div className={styles.runningBadgeContainer}>
          {runningJobs.map(job => (
            <div key={job.id} className={styles.runningBadge}>
              <span>Scraping: <strong>{job.term}</strong>...</span>
              <button onClick={() => handleStopJob(job.id)} className={styles.stopButton}>⏹ Stop</button>
            </div>
          ))}
        </div>
      )}

      <section className={styles.formSection}>
        <h2>Search Configuration</h2>
        <form onSubmit={handleAddSubmit} className={styles.form}>
          <div className={styles.inputField}>
            <label>Keyword</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputField}>
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g. New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.inputField}>
            <label>Date Posted</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className={styles.input}
            >
              <option value="past-24h">Past 24 Hours</option>
              <option value="past-week">Past Week</option>
              <option value="past-month">Past Month</option>
            </select>
          </div>
          <div className={styles.inputField}>
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.input}
            >
              <option value="top-match">Top Match</option>
              <option value="latest">Latest</option>
            </select>
          </div>
          <div className={styles.inputField}>
            <label>Limit</label>
            <input
              type="number"
              placeholder="Max posts"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={1}
              max={100}
              className={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Adding...' : 'Add Keyword Configuration'}
          </button>
        </form>
      </section>

      <section className={styles.listSection}>
        <h2>Active Keywords</h2>
        {keywords.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No active keywords. Add one above to start scraping!</p>
        ) : (
          <div className={styles.keywordList}>
            {keywords.map((kw) => (
              <div key={kw.id} className={styles.keywordCard}>
                <div className={styles.kwInfo}>
                  <strong>{kw.term}</strong>
                  <div className={styles.kwMeta}>
                    <span className={styles.metaBadge}>📍 {kw.location || 'Anywhere'}</span>
                    <span className={styles.metaBadge}>🕒 {kw.timeFilter}</span>
                    <span className={styles.metaBadge}>📊 {kw.sortBy}</span>
                    <span className={styles.metaBadge}>🔢 {kw.limit} posts</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(kw.id)} className={styles.deleteBtn}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
