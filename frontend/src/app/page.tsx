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
  directUrl: string;
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
  const [directUrl, setDirectUrl] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'url'>('keyword');
  const [loading, setLoading] = useState(false);
  const [keywordToDelete, setKeywordToDelete] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);

  useEffect(() => {
    fetchKeywords();
    fetchScheduledStatus();
    fetchRunningJobs();
    fetchServerTime();
    const interval = setInterval(() => {
      fetchRunningJobs();
      fetchServerTime();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServerTime = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/debug`);
      const data = await res.json();
      if (data.server_time_readable) {
        setServerTime(data.server_time_readable);
      }
    } catch (e) {
      console.error('Failed to fetch server time', e);
    }
  };

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
    if (!term && !directUrl) {
      showAlert('Please provide either a Keyword or a Direct URL', 'error');
      return;
    }
    setLoading(true);
    try {
      await createKeyword({ term, location, timeFilter, sortBy, limit, directUrl, isActive: true });
      setTerm('');
      setLocation('');
      setTimeFilter('past-24h');
      setSortBy('top-match');
      setLimit(10);
      setDirectUrl('');
      setSearchMode('keyword');
      await fetchKeywords();
      showAlert('Keyword added successfully');
    } catch (e: any) {
      showAlert(e.message || 'Failed to add keyword', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setKeywordToDelete(id);
  };

  const confirmKeywordDelete = async () => {
    if (!keywordToDelete) return;
    try {
      await deleteKeyword(keywordToDelete);
      await fetchKeywords();
      setKeywordToDelete(null);
      showAlert('Keyword removed');
    } catch (e: any) {
      showAlert('Failed to remove keyword', 'error');
    }
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

      {keywordToDelete && (
        <div className={styles.modalOverlay} onClick={() => setKeywordToDelete(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Remove Keyword?</h3>
            <p>Are you sure you want to remove this keyword configuration? History for this keyword will be preserved, but no new scrapes will be scheduled for it.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setKeywordToDelete(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={confirmKeywordDelete}>Remove Configuration</button>
            </div>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <h1>LinkedIn Automation</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className={styles.schedulerContainer}>
            <div className={styles.inputField} style={{ alignItems: 'center', marginBottom: 0 }}>
              <label style={{ fontSize: '0.9rem' }}>Daily Scrape at:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={styles.input}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '1rem' }}
                />
                {serverTime && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Server Time: {serverTime.split(',')[1]?.trim() || serverTime}
                  </span>
                )}
              </div>
              <button className={styles.exportButton} onClick={handleUpdateSchedule}>
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
        <div className={styles.tabContainer}>
          <div
            className={`${styles.tab} ${searchMode === 'keyword' ? styles.activeTab : ''}`}
            onClick={() => {
              setSearchMode('keyword');
              setDirectUrl('');
            }}
          >
            🔍 Search by Keyword
          </div>
          <div
            className={`${styles.tab} ${searchMode === 'url' ? styles.activeTab : ''}`}
            onClick={() => {
              setSearchMode('url');
              setTerm('');
            }}
          >
            🔗 Direct URL
          </div>
        </div>

        <form onSubmit={handleAddSubmit} className={styles.form}>
          {searchMode === 'keyword' ? (
            <>
              <div className={styles.inputField}>
                <label>Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
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
                  <option value="past-6-months">Past 6 Months</option>
                  <option value="past-year">Past Year</option>
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
            </>
          ) : (
            <div className={styles.inputField} style={{ gridColumn: '1 / -1' }}>
              <label>LinkedIn URL</label>
              <input
                type="text"
                placeholder="Paste the full LinkedIn search or post URL here..."
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.inputField}>
            <label>Limit</label>
            <input
              type="number"
              placeholder="Max posts"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={1}
              max={1000}
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Adding...' : `Add ${searchMode === 'keyword' ? 'Keyword' : 'URL'} Configuration`}
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
                  <strong>
                    {kw.term || (kw.directUrl?.length > 40 ? kw.directUrl.substring(0, 40) + '...' : kw.directUrl)}
                  </strong>
                  <div className={styles.kwMeta}>
                    {!kw.directUrl && (
                      <>
                        <span className={styles.metaBadge}>📍 {kw.location || 'Anywhere'}</span>
                        <span className={styles.metaBadge}>🕒 {kw.timeFilter}</span>
                        <span className={styles.metaBadge}>📊 {kw.sortBy}</span>
                      </>
                    )}
                    <span className={styles.metaBadge}>🔢 {kw.limit} posts</span>
                    {kw.directUrl && <span className={styles.metaBadge}>🔗 Direct URL</span>}
                  </div>
                </div>
                <button onClick={() => handleDeleteClick(kw.id)} className={styles.deleteBtn}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
