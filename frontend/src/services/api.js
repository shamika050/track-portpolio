import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Investments API
export const investmentsAPI = {
    getAll: () => api.get('/investments'),
    getOne: (id) => api.get(`/investments/${id}`),
    create: (data) => api.post('/investments', data),
    update: (id, data) => api.put(`/investments/${id}`, data),
    delete: (id) => api.delete(`/investments/${id}`),
    getBreakdown: (baseCurrency = 'AUD') =>
        api.get(`/investments/summary/breakdown?baseCurrency=${baseCurrency}`),
};

// Portfolio API
export const portfolioAPI = {
    getNetWorth: (baseCurrency = 'AUD') =>
        api.get(`/portfolio/networth?baseCurrency=${baseCurrency}`),
    getReturns: () => api.get('/portfolio/returns'),
    getReturnsSummary: () => api.get('/portfolio/returns/summary'),
    refreshRates: (baseCurrency = 'AUD') =>
        api.post('/portfolio/refresh-rates', { baseCurrency }),
    refreshPrices: () => api.post('/portfolio/refresh-prices'),
    getExchangeRates: () => api.get('/portfolio/exchange-rates'),
    generateAnalysis: (baseCurrency = 'AUD') =>
        api.post('/portfolio/ai-analysis', { baseCurrency }),
    generateReallocation: (baseCurrency = 'AUD') =>
        api.post('/portfolio/ai-reallocation', { baseCurrency }),
    generateProjections: (baseCurrency = 'AUD') =>
        api.post('/portfolio/ai-projections', { baseCurrency }),
    getInsights: (limit = 10) => api.get(`/portfolio/ai-insights?limit=${limit}`),
};

// Settings API
export const settingsAPI = {
    getAll: () => api.get('/settings'),
    update: (key, value) => api.put(`/settings/${key}`, { value }),
};

// Import API
export const importAPI = {
    uploadExcel: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/import/excel', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export default api;
