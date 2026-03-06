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

export const getKeywords = async () => {
    const res = await fetch(`${API_URL}/keywords`);
    return res.json();
};

export const createKeyword = async (data: any) => {
    const res = await fetch(`${API_URL}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateKeyword = async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/keywords/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deleteKeyword = async (id: string) => {
    const res = await fetch(`${API_URL}/keywords/${id}`, {
        method: 'DELETE',
    });
    return res.json();
};

export const triggerScrapeJob = async () => {
    const res = await fetch(`${API_URL}/jobs/trigger`, {
        method: 'POST',
    });
    return res.json();
};

export const getResults = async (limit: number = 50) => {
    const res = await fetch(`${API_URL}/results?limit=${limit}`);
    return res.json();
};

export const downloadResults = () => {
    window.location.href = `${API_URL}/results/download`;
};

export const getScheduledTime = async () => {
    const res = await fetch(`${API_URL}/jobs/scheduled-time`);
    return res.json();
};

export const updateScheduledTime = async (time: string) => {
    const res = await fetch(`${API_URL}/jobs/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time }),
    });
    return res.json();
};

export const getScrapeHistory = async () => {
    const res = await fetch(`${API_URL}/jobs/history`);
    return res.json();
};

export const stopScrapeJob = async (id: string) => {
    const res = await fetch(`${API_URL}/jobs/stop/${id}`, {
        method: 'POST',
    });
    return res.json();
};

export const getResultsByJob = async (jobId: string) => {
    const res = await fetch(`${API_URL}/results/job/${jobId}`);
    return res.json();
};

export const toggleSchedulePause = async (isPaused: boolean) => {
    const res = await fetch(`${API_URL}/jobs/schedule/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused }),
    });
    return res.json();
};
