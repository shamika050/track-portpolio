import axios from 'axios';
import { getOne, runQuery, getAll } from '../db/database.js';
import dotenv from 'dotenv';

dotenv.config();

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Fetch stock price from Alpha Vantage API
 */
async function fetchStockPrice(symbol) {
    try {
        if (!ALPHA_VANTAGE_API_KEY) {
            throw new Error('Alpha Vantage API key not configured');
        }

        const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: symbol,
                apikey: ALPHA_VANTAGE_API_KEY
            }
        });

        const quote = response.data['Global Quote'];

        if (!quote || !quote['05. price']) {
            throw new Error(`No price data found for symbol: ${symbol}`);
        }

        const price = parseFloat(quote['05. price']);
        const currency = 'USD'; // Alpha Vantage returns USD by default

        return { price, currency, symbol };
    } catch (error) {
        console.error(`Failed to fetch stock price for ${symbol}:`, error.message);
        throw error;
    }
}

/**
 * Get stock price (from cache or API)
 */
export async function getStockPrice(symbol, useCache = true) {
    if (!symbol || symbol === 'TO_BE_ADDED') {
        throw new Error('Invalid ticker symbol');
    }

    // Check cache first
    if (useCache) {
        const cached = getOne(
            `SELECT current_price, currency, last_updated FROM stock_prices
             WHERE ticker_symbol = ?`,
            [symbol]
        );

        // Use cache if less than 1 day old
        if (cached) {
            const cacheAge = Date.now() - new Date(cached.last_updated).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (cacheAge < maxAge) {
                console.log(`Using cached price for ${symbol}: ${cached.current_price} ${cached.currency}`);
                return {
                    symbol,
                    price: cached.current_price,
                    currency: cached.currency,
                    cached: true
                };
            }
        }
    }

    // Fetch from API
    console.log(`Fetching fresh price for ${symbol}`);
    const { price, currency } = await fetchStockPrice(symbol);

    // Update cache
    runQuery(
        `INSERT OR REPLACE INTO stock_prices (ticker_symbol, current_price, currency, last_updated)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [symbol, price, currency]
    );

    return { symbol, price, currency, cached: false };
}

/**
 * Refresh stock prices for all investments with auto-update enabled
 */
export async function refreshAllStockPrices() {
    try {
        console.log('🔄 Refreshing stock prices...');

        // Get all investments with auto-update enabled and ticker symbols
        const investments = getAll(
            `SELECT id, ticker_symbol, currency, quantity
             FROM investments
             WHERE auto_update = 'YES'
             AND ticker_symbol IS NOT NULL
             AND ticker_symbol != 'TO_BE_ADDED'
             AND ticker_symbol != ''`
        );

        console.log(`Found ${investments.length} investments to update`);

        const results = [];
        const errors = [];

        for (const inv of investments) {
            try {
                const priceData = await getStockPrice(inv.ticker_symbol, false);
                results.push({
                    id: inv.id,
                    symbol: inv.ticker_symbol,
                    price: priceData.price,
                    currency: priceData.currency
                });

                // Update current_amount in investments table if quantity is available
                if (inv.quantity && inv.quantity > 0) {
                    const currentAmount = priceData.price * inv.quantity;

                    runQuery(
                        `UPDATE investments
                         SET current_amount = ?, updated_date = DATE('now'), modified_at = CURRENT_TIMESTAMP
                         WHERE id = ?`,
                        [currentAmount, inv.id]
                    );

                    // Recalculate profit/loss
                    const investmentData = getOne(
                        `SELECT invested_amount, current_amount FROM investments WHERE id = ?`,
                        [inv.id]
                    );

                    if (investmentData.invested_amount) {
                        const profitLoss = currentAmount - investmentData.invested_amount;
                        runQuery(
                            `UPDATE investments SET profit_loss = ? WHERE id = ?`,
                            [profitLoss, inv.id]
                        );
                    }
                }

                // Small delay to avoid rate limiting (25 calls/day for free tier)
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Failed to update ${inv.ticker_symbol}:`, error.message);
                errors.push({ symbol: inv.ticker_symbol, error: error.message });
            }
        }

        // Update last prices update timestamp
        runQuery(
            `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
             VALUES ('last_prices_update', ?, CURRENT_TIMESTAMP)`,
            [new Date().toISOString()]
        );

        console.log(`✅ Updated ${results.length} stock prices`);
        if (errors.length > 0) {
            console.log(`⚠️  ${errors.length} updates failed`);
        }

        return { success: results, errors };
    } catch (error) {
        console.error('Stock price refresh failed:', error);
        throw error;
    }
}

/**
 * Get cached stock prices
 */
export function getCachedPrices() {
    return getAll(
        `SELECT ticker_symbol, current_price, currency, last_updated
         FROM stock_prices
         ORDER BY last_updated DESC`
    );
}

/**
 * Get last update timestamp for stock prices
 */
export function getLastPriceUpdateTime() {
    const result = getOne(
        `SELECT value as last_updated FROM app_settings WHERE key = 'last_prices_update'`
    );
    return result?.last_updated || null;
}
