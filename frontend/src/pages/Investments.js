import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import { investmentsAPI } from '../services/api';
import { formatCurrency, formatDate, formatPercentage, getInvestmentTypeColor } from '../utils/formatters';

export default function Investments({ baseCurrency }) {
    const [loading, setLoading] = useState(true);
    const [investments, setInvestments] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadInvestments();
    }, []);

    const loadInvestments = async () => {
        try {
            const res = await investmentsAPI.getAll();
            // Sort by ROI (highest first)
            const sorted = res.data.data
                .map(inv => ({
                    ...inv,
                    calculated_roi: inv.invested_amount && inv.current_amount
                        ? ((inv.current_amount - inv.invested_amount) / inv.invested_amount) * 100
                        : -Infinity
                }))
                .sort((a, b) => b.calculated_roi - a.calculated_roi);
            setInvestments(sorted);
        } catch (err) {
            setError('Failed to load investments');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, mb: 3 }}>
                All Investments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sorted by Return on Investment (ROI) - Highest to Lowest
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Rank</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Asset Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Platform</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ticker</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Invested</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Current</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>P/L</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>ROI %</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Currency</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Updated</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {investments.map((inv, index) => {
                            // Calculate P/L from Invested and Current amounts
                            const profitLoss = inv.invested_amount && inv.current_amount
                                ? inv.current_amount - inv.invested_amount
                                : 0;
                            const roiPercent = inv.calculated_roi;

                            return (
                                <TableRow
                                    key={inv.id}
                                    hover
                                    sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                        bgcolor: index < 5 ? 'success.lighter' : 'inherit'
                                    }}
                                >
                                    <TableCell>
                                        <Chip
                                            label={`#${index + 1}`}
                                            size="small"
                                            color={index < 3 ? 'warning' : 'default'}
                                            sx={{ fontWeight: 600 }}
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
                                                fontWeight: 500
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{inv.platform}</TableCell>
                                    <TableCell>{inv.ticker_symbol || '-'}</TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(inv.invested_amount, inv.currency)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(inv.current_amount, inv.currency)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: profitLoss >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 700
                                        }}
                                    >
                                        {formatCurrency(profitLoss, inv.currency)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: roiPercent >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 700,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {formatPercentage(roiPercent)}
                                    </TableCell>
                                    <TableCell>{inv.currency || 'N/A'}</TableCell>
                                    <TableCell>{formatDate(inv.updated_date)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
