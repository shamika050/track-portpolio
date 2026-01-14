import axios from 'axios';
import { getOne, runQuery, getAll } from '../db/database.js';

const EXCHANGE_RATE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';

/**
 * Fetch exchange rate from API
 */
async function fetchExchangeRate(from, to) {
    try {
        const response = await axios.get(`${EXCHANGE_RATE_API_BASE}/${from}`);
        const rate = response.data.rates[to];

        if (!rate) {
            throw new Error(`Exchange rate not found for ${from} to ${to}`);
        }

        return rate;
    } catch (error) {
        console.error(`Failed to fetch exchange rate ${from} -> ${to}:`, error.message);
        throw error;
    }
}

/**
 * Get exchange rate (from cache or API)
 */
export async function getExchangeRate(from, to, useCache = true) {
    // Same currency, return 1
    if (from === to) {
        return 1;
    }

    // Check cache first
    if (useCache) {
        const cached = getOne(
            `SELECT rate, last_updated FROM exchange_rates
             WHERE from_currency = ? AND to_currency = ?`,
            [from, to]
        );

        // Use cache if less than 24 hours old
        if (cached) {
            const cacheAge = Date.now() - new Date(cached.last_updated).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (cacheAge < maxAge) {
                //console.log(`Using cached rate for ${from} -> ${to}: ${cached.rate}`);
                return cached.rate;
            }
        }
    }

    // Fetch from API
    console.log(`Fetching fresh rate for ${from} -> ${to}`);
    const rate = await fetchExchangeRate(from, to);

    // Update cache
    runQuery(
        `INSERT OR REPLACE INTO exchange_rates (from_currency, to_currency, rate, last_updated)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [from, to, rate]
    );

    return rate;
}

/**
 * Refresh all exchange rates for currencies used in portfolio
 */
export async function refreshAllExchangeRates(baseCurrency) {
    try {
        console.log(`🔄 Refreshing exchange rates (base: ${baseCurrency})`);

        // Get all unique currencies from investments
        const currencies = getAll(
            `SELECT DISTINCT currency FROM investments WHERE currency IS NOT NULL`
        ).map(row => row.currency);

        console.log(`Found currencies: ${currencies.join(', ')}`);

        const results = [];

        // Fetch rates for each currency pair
        for (const currency of currencies) {
            if (currency === baseCurrency) continue;

            try {
                const rate = await getExchangeRate(baseCurrency, currency, false);
                results.push({ from: baseCurrency, to: currency, rate });

                // Also get reverse rate
                const reverseRate = await getExchangeRate(currency, baseCurrency, false);
                results.push({ from: currency, to: baseCurrency, rate: reverseRate });

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Failed to fetch rate for ${currency}:`, error.message);
            }
        }

        // Update last rates update timestamp
        runQuery(
            `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
             VALUES ('last_rates_update', ?, CURRENT_TIMESTAMP)`,
            [new Date().toISOString()]
        );

        console.log(`✅ Refreshed ${results.length} exchange rates`);
        return results;
    } catch (error) {
        console.error('Exchange rate refresh failed:', error);
        throw error;
    }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(amount, from, to) {
    const rate = await getExchangeRate(from, to);
    return amount * rate;
}

/**
 * Get all cached exchange rates
 */
export function getCachedRates() {
    return getAll(
        `SELECT from_currency, to_currency, rate, last_updated
         FROM exchange_rates
         ORDER BY last_updated DESC`
    );
}

/**
 * Get last update timestamp
 */
export function getLastUpdateTime() {
    const result = getOne(
        `SELECT value as last_updated FROM app_settings WHERE key = 'last_rates_update'`
    );
    return result?.last_updated || null;
}
