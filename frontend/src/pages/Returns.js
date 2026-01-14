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
} from '@mui/material';
import { portfolioAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Returns({ baseCurrency }) {
    const [loading, setLoading] = useState(true);
    const [returns, setReturns] = useState([]);

    useEffect(() => {
        loadReturns();
    }, []);

    const loadReturns = async () => {
        try {
            const res = await portfolioAPI.getReturns();
            // Sort by amount (highest first)
            const sorted = [...res.data.data].sort((a, b) => {
                const amountA = parseFloat(a.amount) || 0;
                const amountB = parseFloat(b.amount) || 0;
                return amountB - amountA;
            });
            setReturns(sorted);
        } catch (err) {
            console.error('Failed to load returns:', err);
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

    const getReturnTypeColor = (type) => {
        const colors = {
            DIVIDEND: '#10b981',
            INTEREST: '#3b82f6',
            BOND: '#8b5cf6',
            CAPITAL_GAIN: '#f59e0b',
            OTHER: '#6b7280',
        };
        return colors[type] || '#6b7280';
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, mb: 3 }}>
                Investment Returns
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sorted by Return Amount - Highest to Lowest
            </Typography>

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'success.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Rank</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Investment ID</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Asset</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Currency</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {returns.map((ret, index) => (
                            <TableRow
                                key={ret.id}
                                hover
                                sx={{
                                    '&:hover': { bgcolor: 'action.hover' },
                                    bgcolor: index < 5 ? 'rgba(16, 185, 129, 0.08)' : 'inherit'
                                }}
                            >
                                <TableCell>
                                    <Chip
                                        label={`#${index + 1}`}
                                        size="small"
                                        color={index < 3 ? 'success' : 'default'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </TableCell>
                                <TableCell>{formatDate(ret.date)}</TableCell>
                                <TableCell>{ret.investment_id}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{ret.stock_instrument || '-'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={ret.return_type}
                                        size="small"
                                        sx={{
                                            bgcolor: getReturnTypeColor(ret.return_type),
                                            color: 'white',
                                            fontWeight: 500
                                        }}
                                    />
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        color: 'success.main',
                                        fontWeight: 700,
                                        fontSize: '1rem'
                                    }}
                                >
                                    {formatCurrency(ret.amount, ret.currency)}
                                </TableCell>
                                <TableCell>{ret.currency || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
