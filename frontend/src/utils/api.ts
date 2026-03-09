const getBaseURL = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Remove trailing slash if present
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    return url;
};

export const API_URL = getBaseURL();
console.log('Frontend using API URL:', API_URL);

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
};

export const getKeywords = async () => {
    const res = await fetch(`${API_URL}/keywords`);
    return handleResponse(res);
};

export const createKeyword = async (data: any) => {
    const res = await fetch(`${API_URL}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
};

export const updateKeyword = async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/keywords/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
};

export const deleteKeyword = async (id: string) => {
    const res = await fetch(`${API_URL}/keywords/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(res);
};

export const triggerScrapeJob = async () => {
    const res = await fetch(`${API_URL}/jobs/trigger`, {
        method: 'POST',
    });
    return handleResponse(res);
};

export const getResults = async (limit: number = 50) => {
    const res = await fetch(`${API_URL}/results?limit=${limit}`);
    return handleResponse(res);
};

export const downloadResults = () => {
    window.location.href = `${API_URL}/results/download`;
};

export const getScheduledTime = async () => {
    const res = await fetch(`${API_URL}/jobs/scheduled-time`);
    return handleResponse(res);
};

export const updateScheduledTime = async (time: string) => {
    const res = await fetch(`${API_URL}/jobs/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time }),
    });
    return handleResponse(res);
};

export const getScrapeHistory = async () => {
    const res = await fetch(`${API_URL}/jobs/history`);
    return handleResponse(res);
};

export const stopScrapeJob = async (id: string) => {
    const res = await fetch(`${API_URL}/jobs/stop/${id}`, {
        method: 'POST',
    });
    return handleResponse(res);
};

export const getResultsByJob = async (jobId: string) => {
    const res = await fetch(`${API_URL}/results/job/${jobId}`);
    return handleResponse(res);
};

export const toggleSchedulePause = async (isPaused: boolean) => {
    const res = await fetch(`${API_URL}/jobs/schedule/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused }),
    });
    return handleResponse(res);
};

export const deleteScrapeJob = async (id: string) => {
    const res = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(res);
};

export const analyzeLead = async (id: string) => {
    const res = await fetch(`${API_URL}/results/analyze/${id}`, {
        method: 'POST',
    });
    return handleResponse(res);
};

export const bulkAnalyzeJob = async (jobId: string) => {
    const res = await fetch(`${API_URL}/results/analyze-job/${jobId}`, {
        method: 'POST',
    });
    return handleResponse(res);
};
