import express from 'express';
import { getAll, getOne } from '../db/database.js';
import { convertCurrency } from '../services/currency.js';
import { refreshAllExchangeRates, getCachedRates, getLastUpdateTime } from '../services/currency.js';
import { refreshAllStockPrices, getLastPriceUpdateTime } from '../services/stocks.js';
import { generatePortfolioAnalysis, generateReallocationSuggestions, generateProjections, getRecentInsights } from '../services/ai.js';

const router = express.Router();

/**
 * GET /api/portfolio/networth
 * Calculate total net worth in base currency
 */
router.get('/networth', async (req, res) => {
    try {
        const baseCurrency = req.query.baseCurrency || 'AUD';

        const investments = getAll(`SELECT * FROM investments WHERE current_amount IS NOT NULL`);

        let totalNetWorth = 0;
        let totalInvested = 0;
        let totalProfitLoss = 0;

        for (const inv of investments) {
            const currentInBase = await convertCurrency(inv.current_amount, inv.currency, baseCurrency);
            totalNetWorth += currentInBase;

            if (inv.invested_amount) {
                const investedInBase = await convertCurrency(inv.invested_amount, inv.currency, baseCurrency);
                totalInvested += investedInBase;

                // Calculate P/L as Current - Invested (not from stored profit_loss field)
                const profitLoss = inv.current_amount - inv.invested_amount;
                const plInBase = await convertCurrency(profitLoss, inv.currency, baseCurrency);
                totalProfitLoss += plInBase;
            }
        }

        const roi = totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100) : 0;

        res.json({
            success: true,
            data: {
                net_worth: totalNetWorth.toFixed(2),
                total_invested: totalInvested.toFixed(2),
                total_profit_loss: totalProfitLoss.toFixed(2),
                roi_percentage: roi.toFixed(2),
                base_currency: baseCurrency,
                total_investments: investments.length,
                last_updated: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/portfolio/returns
 * Get all investment returns
 */
router.get('/returns', (req, res) => {
    try {
        const returns = getAll(`
            SELECT ir.*, i.asset_name, i.platform
            FROM investment_returns ir
            LEFT JOIN investments i ON ir.investment_id = i.id
            ORDER BY ir.date DESC
        `);

        res.json({ success: true, data: returns });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/portfolio/returns/summary
 * Get returns summary by type and time period
 */
router.get('/returns/summary', (req, res) => {
    try {
        const byType = getAll(`
            SELECT return_type, COUNT(*) as count, SUM(amount) as total, currency
            FROM investment_returns
            GROUP BY return_type, currency
        `);

        const byMonth = getAll(`
            SELECT strftime('%Y-%m', date) as month,
                   SUM(amount) as total,
                   currency,
                   COUNT(*) as count
            FROM investment_returns
            GROUP BY month, currency
            ORDER BY month DESC
            LIMIT 12
        `);

        res.json({
            success: true,
            data: {
                by_type: byType,
                by_month: byMonth
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/portfolio/refresh-rates
 * Refresh all exchange rates
 */
router.post('/refresh-rates', async (req, res) => {
    try {
        const baseCurrency = req.body.baseCurrency || 'AUD';
        const results = await refreshAllExchangeRates(baseCurrency);

        res.json({
            success: true,
            message: 'Exchange rates refreshed',
            data: {
                updated_rates: results.length,
                last_updated: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/portfolio/exchange-rates
 * Get all cached exchange rates
 */
router.get('/exchange-rates', (req, res) => {
    try {
        const rates = getCachedRates();
        const lastUpdate = getLastUpdateTime();

        res.json({
            success: true,
            data: {
                rates,
                last_updated: lastUpdate
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/portfolio/refresh-prices
 * Refresh stock prices
 */
router.post('/refresh-prices', async (req, res) => {
    try {
        const results = await refreshAllStockPrices();

        res.json({
            success: true,
            message: 'Stock prices refreshed',
            data: {
                updated: results.success.length,
                failed: results.errors.length,
                errors: results.errors,
                last_updated: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/portfolio/ai-analysis
 * Generate AI-powered portfolio analysis
 */
router.post('/ai-analysis', async (req, res) => {
    try {
        const baseCurrency = req.body.baseCurrency || 'AUD';
        const result = await generatePortfolioAnalysis(baseCurrency);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/portfolio/ai-reallocation
 * Generate AI-powered reallocation suggestions
 */
router.post('/ai-reallocation', async (req, res) => {
    try {
        const baseCurrency = req.body.baseCurrency || 'AUD';
        const result = await generateReallocationSuggestions(baseCurrency);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/portfolio/ai-projections
 * Generate AI-powered future projections
 */
router.post('/ai-projections', async (req, res) => {
    try {
        const baseCurrency = req.body.baseCurrency || 'AUD';
        const result = await generateProjections(baseCurrency);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/portfolio/ai-insights
 * Get recent AI insights
 */
router.get('/ai-insights', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const insights = getRecentInsights(limit);

        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
