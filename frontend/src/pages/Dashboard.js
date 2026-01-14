import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Star as StarIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { portfolioAPI, investmentsAPI } from '../services/api';
import { formatCurrency, formatPercentage, getInvestmentTypeColor } from '../utils/formatters';

export default function Dashboard({ baseCurrency }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [netWorth, setNetWorth] = useState(null);
    const [breakdown, setBreakdown] = useState(null);
    const [investments, setInvestments] = useState([]);
    const [hideValues, setHideValues] = useState(false);

    const loadData = async () => {
        try {
            setError(null);
            const [networthRes, breakdownRes, investmentsRes] = await Promise.all([
                portfolioAPI.getNetWorth(baseCurrency),
                investmentsAPI.getBreakdown(baseCurrency),
                investmentsAPI.getAll(),
            ]);

            setNetWorth(networthRes.data.data);
            setBreakdown(breakdownRes.data.data);
            setInvestments(investmentsRes.data.data);
        } catch (err) {
            setError(err.message || 'Failed to load portfolio data');
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [baseCurrency]);

    const handleRefreshRates = async () => {
        setRefreshing(true);
        try {
            await portfolioAPI.refreshRates(baseCurrency);
            await loadData();
        } catch (err) {
            setError('Failed to refresh exchange rates');
        } finally {
            setRefreshing(false);
        }
    };

    const handleRefreshPrices = async () => {
        setRefreshing(true);
        try {
            await portfolioAPI.refreshPrices();
            await loadData();
        } catch (err) {
            setError('Failed to refresh stock prices');
        } finally {
            setRefreshing(false);
        }
    };

    // Helper function to mask currency values
    const maskValue = (value, currency) => {
        if (!hideValues) return formatCurrency(value, currency);
        return '••••••';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Calculate top 10 profitable investments
    const topPerformers = investments
        .filter(inv => inv.invested_amount && inv.current_amount)
        .map(inv => ({
            ...inv,
            profit_loss: inv.current_amount - inv.invested_amount,
            roi_percent: ((inv.current_amount - inv.invested_amount) / inv.invested_amount) * 100,
        }))
        .sort((a, b) => b.roi_percent - a.roi_percent)
        .slice(0, 10);

    // Prepare chart data
    const typeChartData = breakdown?.by_type?.reduce((acc, item) => {
        const existing = acc.find(d => d.name === item.investment_type);
        if (existing) {
            existing.value += item.total_current_base || 0;
        } else {
            acc.push({
                name: item.investment_type,
                value: item.total_current_base || 0,
            });
        }
        return acc;
    }, []).filter(d => d.value > 0) || [];

    const currencyData = breakdown?.by_currency?.map(item => ({
        name: item.currency,
        count: item.count,
        value: parseFloat(item.total_current || 0),
    })) || [];

    const roi = parseFloat(netWorth?.roi_percentage || 0);
    const profitLoss = parseFloat(netWorth?.total_profit_loss || 0);

    // Generate forecast data based on current ROI
    const currentNetWorth = parseFloat(netWorth?.net_worth || 0);
    const monthlyROI = roi / 12; // Annualized ROI divided by 12 months
    const forecastData = [];

    for (let i = 0; i <= 12; i++) {
        const growthFactor = 1 + (monthlyROI / 100) * i;
        forecastData.push({
            month: i === 0 ? 'Now' : `${i}M`,
            value: currentNetWorth * growthFactor,
        });
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ color: 'primary.main' }}>Dashboard</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        startIcon={hideValues ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        onClick={() => setHideValues(!hideValues)}
                        variant="outlined"
                        color={hideValues ? 'warning' : 'primary'}
                    >
                        {hideValues ? 'Show Values' : 'Hide Values'}
                    </Button>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={handleRefreshRates}
                        disabled={refreshing}
                        variant="outlined"
                    >
                        Refresh Rates
                    </Button>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={handleRefreshPrices}
                        disabled={refreshing}
                        variant="contained"
                    >
                        Refresh Prices
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Net Worth Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="inherit" gutterBottom sx={{ opacity: 0.9 }}>
                                Net Worth
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {maskValue(netWorth?.net_worth, baseCurrency)}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {netWorth?.total_investments || 0} investments
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="inherit" gutterBottom sx={{ opacity: 0.9 }}>
                                Total Invested
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {maskValue(netWorth?.total_invested, baseCurrency)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: profitLoss >= 0
                            ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                            : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Typography color="inherit" gutterBottom sx={{ opacity: 0.9 }}>
                                Profit/Loss
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {maskValue(netWorth?.total_profit_loss, baseCurrency)}
                                </Typography>
                                {profitLoss >= 0 ? (
                                    <TrendingUpIcon sx={{ ml: 1 }} />
                                ) : (
                                    <TrendingDownIcon sx={{ ml: 1 }} />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: roi >= 0
                            ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                            : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Typography color="inherit" gutterBottom sx={{ opacity: 0.9 }}>
                                ROI
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {formatPercentage(roi)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Top 10 Performers */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <StarIcon sx={{ color: 'warning.main', mr: 1 }} />
                            <Typography variant="h6">Top 10 Profitable Investments</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Rank</TableCell>
                                        <TableCell>Asset</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Invested</TableCell>
                                        <TableCell align="right">Current</TableCell>
                                        <TableCell align="right">Profit/Loss</TableCell>
                                        <TableCell align="right">ROI</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {topPerformers.map((inv, index) => (
                                        <TableRow key={inv.id} hover>
                                            <TableCell>
                                                <Chip
                                                    label={`#${index + 1}`}
                                                    size="small"
                                                    color={index === 0 ? 'warning' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{inv.asset_name || inv.id}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={inv.investment_type}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getInvestmentTypeColor(inv.investment_type),
                                                        color: 'white',
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {maskValue(inv.invested_amount, inv.currency)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {maskValue(inv.current_amount, inv.currency)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                                {maskValue(inv.profit_loss, inv.currency)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>
                                                {formatPercentage(inv.roi_percent)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Charts Section with Better Layout */}
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mb: 3, mt: 2 }}>
                Portfolio Analytics
            </Typography>

            <Grid container spacing={4}>
                {/* Portfolio by Type - Full Width */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
                            Portfolio Distribution by Investment Type
                        </Typography>
                        {typeChartData.length > 0 ? (
                            <Box sx={{ width: '100%', height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <ResponsiveContainer width="95%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={typeChartData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={160}
                                            innerRadius={80}
                                            label={(entry) => `${entry.name}`}
                                            labelLine={true}
                                            paddingAngle={3}
                                        >
                                            {typeChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getInvestmentTypeColor(entry.name)} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => hideValues ? '••••••' : formatCurrency(value, baseCurrency)}
                                            contentStyle={{ fontSize: '14px', padding: '10px', borderRadius: '8px' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={50}
                                            iconSize={16}
                                            wrapperStyle={{ fontSize: '15px', paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        ) : (
                            <Typography color="textSecondary" align="center" sx={{ py: 8 }}>
                                No data available
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Holdings by Currency - Full Width */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
                            Investment Holdings by Currency
                        </Typography>
                        {currencyData.length > 0 ? (
                            <Box sx={{ width: '100%', height: 450 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={currencyData}
                                        margin={{ top: 30, right: 50, left: 50, bottom: 50 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 16, fontWeight: 500 }}
                                            stroke="#666"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 16 }}
                                            stroke="#666"
                                            label={{ value: 'Number of Investments', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
                                        />
                                        <Tooltip
                                            formatter={(value) => `${value} investments`}
                                            contentStyle={{ fontSize: '14px', padding: '10px', borderRadius: '8px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '15px', paddingTop: '20px' }} />
                                        <Bar
                                            dataKey="count"
                                            fill="#6366f1"
                                            name="Number of Investments"
                                            radius={[10, 10, 0, 0]}
                                            barSize={80}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        ) : (
                            <Typography color="textSecondary" align="center" sx={{ py: 8 }}>
                                No data available
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* 12-Month Forecast - Full Width */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                            12-Month Portfolio Value Forecast
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Projected growth based on current ROI of {formatPercentage(roi)} (assumes consistent monthly returns)
                        </Typography>
                        {forecastData.length > 0 ? (
                            <Box sx={{ width: '100%', height: 450, bgcolor: 'white', borderRadius: 2, p: 2 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={forecastData}
                                        margin={{ top: 30, right: 50, left: 50, bottom: 50 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 14 }}
                                            stroke="#666"
                                            label={{ value: 'Time Period', position: 'insideBottom', offset: -10, style: { fontSize: 14 } }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 14 }}
                                            stroke="#666"
                                            tickFormatter={(value) => hideValues ? '•••' : `${(value / 1000).toFixed(0)}K`}
                                            label={{ value: hideValues ? 'Value' : `Value (${baseCurrency})`, angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
                                        />
                                        <Tooltip
                                            formatter={(value) => hideValues ? '••••••' : formatCurrency(value, baseCurrency, 0)}
                                            contentStyle={{ fontSize: '14px', padding: '10px', borderRadius: '8px' }}
                                            labelFormatter={(label) => `Period: ${label}`}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '15px', paddingTop: '20px' }} />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            dot={{ fill: '#10b981', r: 5 }}
                                            activeDot={{ r: 8 }}
                                            name="Projected Portfolio Value"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        ) : (
                            <Typography color="textSecondary" align="center" sx={{ py: 8 }}>
                                No forecast data available
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
