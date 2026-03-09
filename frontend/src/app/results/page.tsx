"use client";

import { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { getScrapeHistory, getResultsByJob, downloadResults, downloadJobResults, deleteScrapeJob, bulkAnalyzeJob, analyzeLead } from '../../utils/api';

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
    qualityScore?: number;
    qualityReason?: string;
    isQualified?: boolean;
};

export default function ResultsPage() {
    const [history, setHistory] = useState<ScrapeJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
    const [results, setResults] = useState<ScrapedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState<string | null>(null);

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
        if (selectedJob) {
            downloadJobResults(selectedJob.id);
        } else {
            downloadResults();
        }
    };

    const handleDeleteJob = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent row click
        setJobToDelete(id);
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;
        try {
            await deleteScrapeJob(jobToDelete);
            setJobToDelete(null);
            fetchHistory();
        } catch (e) {
            console.error(e);
            alert('Failed to delete job');
        }
    };

    const handleBulkAnalyze = async () => {
        if (!selectedJob) return;
        setAnalyzing(selectedJob.id);
        try {
            await bulkAnalyzeJob(selectedJob.id);
            const data = await getResultsByJob(selectedJob.id);
            setResults(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            alert('Failed to analyze leads');
        } finally {
            setAnalyzing(null);
        }
    };

    const handleSingleAnalyze = async (id: string) => {
        setAnalyzing(id);
        try {
            await analyzeLead(id);
            const data = await getResultsByJob(selectedJob!.id);
            setResults(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            alert('Failed to analyze lead');
        } finally {
            setAnalyzing(null);
        }
    };

    return (
        <main className={styles.main}>
            {jobToDelete && (
                <div className={styles.modalOverlay} onClick={() => setJobToDelete(null)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Session?</h3>
                        <p>Are you sure you want to delete this scrape session? This action cannot be undone and all associated results will be lost.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setJobToDelete(null)}>Cancel</button>
                            <button className={styles.confirmDeleteBtn} onClick={confirmDelete}>Delete Session</button>
                        </div>
                    </div>
                </div>
            )}

            <section className={styles.resultsSection} style={{ marginTop: 0 }}>
                <div className={styles.resultsHeader}>
                    <h2>{selectedJob ? `Results for: ${selectedJob.term}` : 'Scrape History'}</h2>
                    <div className={styles.headerActions}>
                        {selectedJob && (
                            <>
                                <button
                                    className={styles.exportButton}
                                    onClick={handleBulkAnalyze}
                                    disabled={analyzing !== null}
                                    style={{ background: 'var(--primary)', color: 'white' }}
                                >
                                    {analyzing === selectedJob.id ? '⌛ Analyzing...' : '✨ Analyze All Leads'}
                                </button>
                                <button className={styles.exportButton} onClick={() => setSelectedJob(null)} style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                    ← Back to History
                                </button>
                            </>
                        )}
                        <button className={styles.exportButton} onClick={handleDownload} disabled={history.length === 0}>
                            {selectedJob ? '📥 Download This Session CSV' : '📥 Download Latest CSV'}
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
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className={styles.postLink}>View Results</button>
                                                    <button
                                                        onClick={(e) => handleDeleteJob(e, job.id)}
                                                        className={styles.deleteBtn}
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', margin: 0 }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
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
                                    <th>Quality Score</th>
                                    <th>Date</th>
                                    <th>Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No posts found for this session.</td></tr>
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
                                            <td>
                                                {post.qualityScore !== null && post.qualityScore !== undefined ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div className={styles.badge} style={{
                                                                background: post.qualityScore >= 70 ? '#D1FAE5' : post.qualityScore >= 40 ? '#FEF3C7' : '#FEE2E2',
                                                                color: post.qualityScore >= 70 ? '#065F46' : post.qualityScore >= 40 ? '#92400E' : '#991B1B',
                                                                border: 'none',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                {post.qualityScore}%
                                                            </div>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: post.qualityScore >= 70 ? '#059669' : post.qualityScore >= 40 ? '#D97706' : '#DC2626' }}>
                                                                {post.qualityScore >= 70 ? 'High Quality' : post.qualityScore >= 40 ? 'Average' : 'Low Quality'}
                                                            </span>
                                                            <button
                                                                onClick={() => handleSingleAnalyze(post.id)}
                                                                disabled={analyzing !== null}
                                                                className={styles.postLink}
                                                                style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', marginLeft: 'auto' }}
                                                            >
                                                                {analyzing === post.id ? '⌛' : '🔄 Analyse Again'}
                                                            </button>
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--text-muted)',
                                                            lineHeight: '1.4',
                                                            marginTop: '4px',
                                                            whiteSpace: 'pre-wrap',
                                                            maxWidth: '300px'
                                                        }}>
                                                            {post.qualityReason}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSingleAnalyze(post.id)}
                                                        disabled={analyzing !== null}
                                                        className={styles.postLink}
                                                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                                    >
                                                        {analyzing === post.id ? '⌛...' : '✨ Analyze'}
                                                    </button>
                                                )}
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
