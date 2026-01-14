import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import { Lightbulb as InsightIcon } from '@mui/icons-material';
import { portfolioAPI } from '../services/api';

export default function Insights({ baseCurrency }) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [reallocation, setReallocation] = useState(null);
    const [projections, setProjections] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const handleGenerateAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await portfolioAPI.generateAnalysis(baseCurrency);
            setAnalysis(res.data.data.analysis);
        } catch (err) {
            setError('Failed to generate analysis. Make sure your Anthropic API key is configured.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReallocation = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await portfolioAPI.generateReallocation(baseCurrency);
            setReallocation(res.data.data.suggestions);
        } catch (err) {
            setError('Failed to generate suggestions. Make sure your Anthropic API key is configured.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateProjections = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await portfolioAPI.generateProjections(baseCurrency);
            setProjections(res.data.data.projections);
        } catch (err) {
            setError('Failed to generate projections. Make sure your Anthropic API key is configured.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                AI-Powered Insights
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                <Tab label="Portfolio Analysis" />
                <Tab label="Reallocation Suggestions" />
                <Tab label="Future Projections" />
            </Tabs>

            {activeTab === 0 && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Portfolio Health Analysis</Typography>
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} /> : <InsightIcon />}
                            onClick={handleGenerateAnalysis}
                            disabled={loading}
                        >
                            Generate Analysis
                        </Button>
                    </Box>
                    {analysis && (
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', whiteSpace: 'pre-wrap' }}>
                            <Typography>{analysis}</Typography>
                        </Paper>
                    )}
                </Paper>
            )}

            {activeTab === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Asset Reallocation Recommendations</Typography>
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} /> : <InsightIcon />}
                            onClick={handleGenerateReallocation}
                            disabled={loading}
                        >
                            Generate Suggestions
                        </Button>
                    </Box>
                    {reallocation && (
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', whiteSpace: 'pre-wrap' }}>
                            <Typography>{reallocation}</Typography>
                        </Paper>
                    )}
                </Paper>
            )}

            {activeTab === 2 && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Future Value Projections</Typography>
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} /> : <InsightIcon />}
                            onClick={handleGenerateProjections}
                            disabled={loading}
                        >
                            Generate Projections
                        </Button>
                    </Box>
                    {projections && (
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', whiteSpace: 'pre-wrap' }}>
                            <Typography>{projections}</Typography>
                        </Paper>
                    )}
                </Paper>
            )}
        </Box>
    );
}
