"use client";

import { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { getScrapeHistory, getResultsByJob, downloadResults } from '../../utils/api';

type ScrapeJob = {
    id: string;
    term: string;
    status: string;
    startedAt: string;
    finishedAt: string;
    itemCount: number;
};

type ScrapedPost = {
    id: string;
    term: string;
    description: string;
    postLink: string;
    datePosted: string;
    authorName: string;
    authorHeadline: string;
    numLikes: number;
    numComments: number;
    scrapedAt: string;
};

export default function ResultsPage() {
    const [history, setHistory] = useState<ScrapeJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
    const [results, setResults] = useState<ScrapedPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(() => {
            if (!selectedJob) fetchHistory();
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedJob]);

    const fetchHistory = async () => {
        try {
            const data = await getScrapeHistory();
            setHistory(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectJob = async (job: ScrapeJob) => {
        setLoading(true);
        setSelectedJob(job);
        try {
            const data = await getResultsByJob(job.id);
            setResults(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        downloadResults();
    };

    return (
        <main className={styles.main}>
            <section className={styles.resultsSection} style={{ marginTop: 0 }}>
                <div className={styles.resultsHeader}>
                    <h2>{selectedJob ? `Results for: ${selectedJob.term}` : 'Scrape History'}</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {selectedJob && (
                            <button className={styles.exportButton} onClick={() => setSelectedJob(null)} style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                ← Back to History
                            </button>
                        )}
                        <button className={styles.exportButton} onClick={handleDownload} disabled={history.length === 0}>
                            📥 Download Latest CSV
                        </button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    {loading ? (
                        <p style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Loading...
                        </p>
                    ) : !selectedJob ? (
                        // History List View
                        <table className={styles.resultsTable}>
                            <thead>
                                <tr>
                                    <th>Keyword</th>
                                    <th>Started At</th>
                                    <th>Status</th>
                                    <th>Items Found</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No scrape sessions found.</td></tr>
                                ) : (
                                    history.map(job => (
                                        <tr key={job.id} onClick={() => handleSelectJob(job)} style={{ cursor: 'pointer' }}>
                                            <td><strong>{job.term}</strong></td>
                                            <td>{new Date(job.startedAt).toLocaleString()}</td>
                                            <td>
                                                <span className={`${styles.badge} ${job.status === 'RUNNING' ? styles.statusRunning : ''}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td>{job.itemCount || 0}</td>
                                            <td>
                                                <button className={styles.postLink}>View Results</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        // Detailed Results View for a Job
                        <table className={styles.resultsTable}>
                            <thead>
                                <tr>
                                    <th>Author</th>
                                    <th>Description</th>
                                    <th>Engagement</th>
                                    <th>Date</th>
                                    <th>Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No posts found for this session.</td></tr>
                                ) : (
                                    results.map((post) => (
                                        <tr key={post.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{post.authorName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.authorHeadline}</div>
                                            </td>
                                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.description}</td>
                                            <td>
                                                <div style={{ fontSize: '0.8rem' }}>👍 {post.numLikes}</div>
                                                <div style={{ fontSize: '0.8rem' }}>💬 {post.numComments}</div>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {new Date(post.scrapedAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <a href={post.postLink} target="_blank" rel="noopener noreferrer" className={styles.postLink}>
                                                    View Post
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </main>
    );
}
