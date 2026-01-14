import express from 'express';
import { getAll, getOne, runQuery } from '../db/database.js';
import { convertCurrency } from '../services/currency.js';

const router = express.Router();

/**
 * GET /api/investments
 * Get all investments
 */
router.get('/', async (req, res) => {
    try {
        const investments = getAll(`SELECT * FROM investments ORDER BY investment_type, platform`);
        res.json({ success: true, data: investments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/investments/:id
 * Get single investment by ID
 */
router.get('/:id', (req, res) => {
    try {
        const investment = getOne(`SELECT * FROM investments WHERE id = ?`, [req.params.id]);

        if (!investment) {
            return res.status(404).json({ success: false, error: 'Investment not found' });
        }

        res.json({ success: true, data: investment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/investments
 * Create new investment
 */
router.post('/', (req, res) => {
    try {
        const {
            id, platform, investment_type, ticker_symbol, asset_name,
            invested_amount, current_amount, profit_loss, currency,
            updated_date, purchase_date, quantity, auto_update, notes
        } = req.body;

        runQuery(`
            INSERT INTO investments
            (id, platform, investment_type, ticker_symbol, asset_name, invested_amount,
             current_amount, profit_loss, currency, updated_date, purchase_date,
             quantity, auto_update, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, platform, investment_type, ticker_symbol, asset_name, invested_amount,
            current_amount, profit_loss, currency, updated_date, purchase_date,
            quantity, auto_update, notes]);

        res.json({ success: true, message: 'Investment created', id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/investments/:id
 * Update investment
 */
router.put('/:id', (req, res) => {
    try {
        const {
            platform, investment_type, ticker_symbol, asset_name,
            invested_amount, current_amount, profit_loss, currency,
            updated_date, purchase_date, quantity, auto_update, notes
        } = req.body;

        runQuery(`
            UPDATE investments
            SET platform = ?, investment_type = ?, ticker_symbol = ?, asset_name = ?,
                invested_amount = ?, current_amount = ?, profit_loss = ?, currency = ?,
                updated_date = ?, purchase_date = ?, quantity = ?, auto_update = ?, notes = ?,
                modified_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [platform, investment_type, ticker_symbol, asset_name, invested_amount,
            current_amount, profit_loss, currency, updated_date, purchase_date,
            quantity, auto_update, notes, req.params.id]);

        res.json({ success: true, message: 'Investment updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/investments/:id
 * Delete investment
 */
router.delete('/:id', (req, res) => {
    try {
        runQuery(`DELETE FROM investments WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Investment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/investments/summary/breakdown
 * Get portfolio breakdown by type, currency, platform
 */
router.get('/summary/breakdown', async (req, res) => {
    try {
        const baseCurrency = req.query.baseCurrency || 'AUD';

        const byType = getAll(`
            SELECT investment_type, COUNT(*) as count,
                   SUM(invested_amount) as total_invested,
                   SUM(current_amount) as total_current,
                   SUM(profit_loss) as total_profit_loss,
                   currency
            FROM investments
            GROUP BY investment_type, currency
        `);

        const byCurrency = getAll(`
            SELECT currency, COUNT(*) as count,
                   SUM(invested_amount) as total_invested,
                   SUM(current_amount) as total_current
            FROM investments
            WHERE currency IS NOT NULL
            GROUP BY currency
        `);

        const byPlatform = getAll(`
            SELECT platform, COUNT(*) as count,
                   SUM(current_amount) as total_current,
                   currency
            FROM investments
            GROUP BY platform, currency
        `);

        // Convert to base currency
        const convertBreakdown = async (items) => {
            const converted = [];
            for (const item of items) {
                const totalCurrentInBase = item.total_current ?
                    await convertCurrency(item.total_current, item.currency, baseCurrency) : 0;
                converted.push({ ...item, total_current_base: totalCurrentInBase, base_currency: baseCurrency });
            }
            return converted;
        };

        const byTypeConverted = await convertBreakdown(byType);
        const byPlatformConverted = await convertBreakdown(byPlatform);

        res.json({
            success: true,
            data: {
                by_type: byTypeConverted,
                by_currency: byCurrency,
                by_platform: byPlatformConverted,
                base_currency: baseCurrency
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
