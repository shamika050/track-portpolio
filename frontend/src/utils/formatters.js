export const formatCurrency = (amount, currency = 'AUD', decimals = 2) => {
    if (amount === null || amount === undefined) return '-';

    const num = parseFloat(amount);
    if (isNaN(num)) return '-';

    // Handle null or undefined currency
    const validCurrency = currency || 'AUD';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

export const formatPercentage = (value, decimals = 2) => {
    if (value === null || value === undefined) return '-';

    const num = parseFloat(value);
    if (isNaN(num)) return '-';

    return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '-';

    const num = parseFloat(value);
    if (isNaN(num)) return '-';

    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

export const formatDate = (date) => {
    if (!date) return '-';

    try {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return '-';
    }
};

export const getInvestmentTypeColor = (type) => {
    const colors = {
        STOCK: '#1976d2',
        ETF: '#0288d1',
        FUND: '#0288d1',
        BOND: '#388e3c',
        CRYPTO: '#f57c00',
        SAVING: '#7b1fa2',
        PROPERTY: '#c2185b',
        SUPER: '#5e35b1',
        LOAN: '#d32f2f',
        FD: '#00796b',
        SOLD: '#757575',
    };
    return colors[type] || '#616161';
};

export const getChangeColor = (value) => {
    if (!value || value === 0) return '#757575';
    return value > 0 ? '#4caf50' : '#f44336';
};
