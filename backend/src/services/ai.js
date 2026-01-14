import Anthropic from '@anthropic-ai/sdk';
import { getAll, runQuery } from '../db/database.js';
import { convertCurrency } from './currency.js';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Get portfolio summary for AI analysis
 */
async function getPortfolioSummary(baseCurrency) {
    const investments = getAll(`SELECT * FROM investments`);

    const summary = {
        total_investments: investments.length,
        by_type: {},
        by_currency: {},
        by_platform: {},
        total_invested: 0,
        total_current: 0,
        total_profit_loss: 0,
        base_currency: baseCurrency,
        investments: []
    };

    for (const inv of investments) {
        // Count by type
        summary.by_type[inv.investment_type] = (summary.by_type[inv.investment_type] || 0) + 1;

        // Count by currency
        summary.by_currency[inv.currency] = (summary.by_currency[inv.currency] || 0) + 1;

        // Count by platform
        summary.by_platform[inv.platform] = (summary.by_platform[inv.platform] || 0) + 1;

        // Convert to base currency for totals
        if (inv.invested_amount) {
            const investedInBase = await convertCurrency(inv.invested_amount, inv.currency, baseCurrency);
            summary.total_invested += investedInBase;
        }

        if (inv.current_amount) {
            const currentInBase = await convertCurrency(inv.current_amount, inv.currency, baseCurrency);
            summary.total_current += currentInBase;
        }

        // Calculate P/L based on Current - Invested
        let profitLoss = 0;
        if (inv.current_amount && inv.invested_amount) {
            profitLoss = inv.current_amount - inv.invested_amount;
            const plInBase = await convertCurrency(profitLoss, inv.currency, baseCurrency);
            summary.total_profit_loss += plInBase;
        }

        summary.investments.push({
            id: inv.id,
            type: inv.investment_type,
            platform: inv.platform,
            asset_name: inv.asset_name,
            invested: inv.invested_amount,
            current: inv.current_amount,
            profit_loss: profitLoss,
            roi_percent: inv.invested_amount > 0 ? ((profitLoss / inv.invested_amount) * 100) : 0,
            currency: inv.currency
        });
    }

    return summary;
}

/**
 * Generate portfolio analysis using Claude API
 */
export async function generatePortfolioAnalysis(baseCurrency = 'AUD') {
    try {
        console.log('🤖 Generating AI portfolio analysis...');

        const portfolio = await getPortfolioSummary(baseCurrency);

        const prompt = `You are a financial advisor analyzing an investment portfolio. Here's the portfolio data:

Total Investments: ${portfolio.total_investments}
Base Currency: ${portfolio.base_currency}
Total Invested: ${portfolio.total_invested.toFixed(2)} ${baseCurrency}
Current Value: ${portfolio.total_current.toFixed(2)} ${baseCurrency}
Total Profit/Loss: ${portfolio.total_profit_loss.toFixed(2)} ${baseCurrency}
ROI: ${((portfolio.total_profit_loss / portfolio.total_invested) * 100).toFixed(2)}%

Investment Breakdown by Type:
${Object.entries(portfolio.by_type).map(([type, count]) => `- ${type}: ${count} investments`).join('\n')}

Investment Breakdown by Platform:
${Object.entries(portfolio.by_platform).map(([platform, count]) => `- ${platform}: ${count} investments`).join('\n')}

Currency Distribution:
${Object.entries(portfolio.by_currency).map(([curr, count]) => `- ${curr}: ${count} investments`).join('\n')}

Sample Investments:
${portfolio.investments.slice(0, 10).map(inv => `- ${inv.asset_name} (${inv.type}): ${inv.current || 'N/A'} ${inv.currency}, P/L: ${inv.profit_loss || 'N/A'}`).join('\n')}

Please provide:
1. Overall portfolio health assessment
2. Diversification analysis
3. Risk assessment
4. Key strengths and weaknesses
5. Specific recommendations for improvement

Keep your analysis concise and actionable.`;

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 2000,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const analysis = message.content[0].text;

        // Save to database
        runQuery(
            `INSERT INTO ai_insights (insight_type, content, portfolio_snapshot, generated_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            ['portfolio_analysis', analysis, JSON.stringify(portfolio)]
        );

        console.log('✅ AI analysis generated successfully');

        return {
            analysis,
            portfolio_summary: {
                total_invested: portfolio.total_invested,
                current_value: portfolio.total_current,
                profit_loss: portfolio.total_profit_loss,
                roi_percentage: ((portfolio.total_profit_loss / portfolio.total_invested) * 100).toFixed(2),
                base_currency: baseCurrency
            }
        };
    } catch (error) {
        console.error('AI analysis failed:', error);
        throw error;
    }
}

/**
 * Generate asset reallocation suggestions
 */
export async function generateReallocationSuggestions(baseCurrency = 'AUD') {
    try {
        console.log('🤖 Generating reallocation suggestions...');

        const portfolio = await getPortfolioSummary(baseCurrency);

        // Calculate percentages
        const typeBreakdown = Object.entries(portfolio.by_type).map(([type, count]) => {
            const typeInvestments = portfolio.investments.filter(inv => inv.type === type);
            const typeValue = typeInvestments.reduce((sum, inv) => sum + (inv.current || 0), 0);
            const percentage = (typeValue / portfolio.total_current) * 100;
            return { type, count, value: typeValue, percentage };
        });

        const prompt = `You are a financial advisor reviewing an investment portfolio for reallocation opportunities.

Portfolio Overview:
- Total Value: ${portfolio.total_current.toFixed(2)} ${baseCurrency}
- Total Investments: ${portfolio.total_investments}

Current Allocation:
${typeBreakdown.map(item => `- ${item.type}: ${item.percentage.toFixed(1)}% (${item.value.toFixed(2)} ${baseCurrency})`).join('\n')}

${portfolio.investments.filter(inv => inv.type === 'SAVING').length > 0 ?
`\nNote: Portfolio includes ${portfolio.investments.filter(inv => inv.type === 'SAVING').length} SAVING accounts, which may represent idle capital.` : ''}

Please analyze this portfolio and provide:
1. Identification of underutilized assets (especially idle cash in savings)
2. Specific reallocation recommendations
3. Suggested asset allocation percentages
4. Justification for each recommendation
5. Risk considerations

Focus on practical, actionable advice. If there's significant cash in savings accounts, suggest better alternatives based on the user's existing investment types.`;

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 2000,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const suggestions = message.content[0].text;

        // Save to database
        runQuery(
            `INSERT INTO ai_insights (insight_type, content, portfolio_snapshot, generated_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            ['reallocation_suggestions', suggestions, JSON.stringify({ portfolio, typeBreakdown })]
        );

        console.log('✅ Reallocation suggestions generated');

        return {
            suggestions,
            current_allocation: typeBreakdown
        };
    } catch (error) {
        console.error('Reallocation suggestion failed:', error);
        throw error;
    }
}

/**
 * Generate future projections based on historical data
 */
export async function generateProjections(baseCurrency = 'AUD') {
    try {
        console.log('🤖 Generating future projections...');

        const portfolio = await getPortfolioSummary(baseCurrency);

        // Get detailed returns data
        const returns = getAll(`
            SELECT return_type, SUM(amount) as total, currency, COUNT(*) as count,
                   MIN(date) as first_date, MAX(date) as last_date
            FROM investment_returns
            GROUP BY return_type, currency
        `);

        // Calculate total returns in base currency
        let totalReturnsBase = 0;
        for (const ret of returns) {
            const returnInBase = await convertCurrency(ret.total, ret.currency, baseCurrency);
            totalReturnsBase += returnInBase;
        }

        // Get savings amount for reinvestment assumptions
        const savingsData = getAll(`
            SELECT SUM(current_amount) as total_savings, currency
            FROM investments
            WHERE investment_type = 'SAVING'
            GROUP BY currency
        `);

        let totalSavingsBase = 0;
        for (const sav of savingsData) {
            const savInBase = await convertCurrency(sav.total_savings, sav.currency, baseCurrency);
            totalSavingsBase += savInBase;
        }

        // Calculate average monthly returns
        const monthsOfData = returns.length > 0 && returns[0].first_date && returns[0].last_date
            ? Math.max(1, Math.ceil((new Date(returns[0].last_date) - new Date(returns[0].first_date)) / (1000 * 60 * 60 * 24 * 30)))
            : 12;
        const avgMonthlyReturns = totalReturnsBase / monthsOfData;

        // Calculate current portfolio growth rate
        const currentROI = portfolio.total_invested > 0 ? (portfolio.total_profit_loss / portfolio.total_invested) * 100 : 0;

        const prompt = `You are a financial analyst projecting future portfolio performance based on historical data.

CURRENT PORTFOLIO STATUS:
- Current Portfolio Value: ${portfolio.total_current.toFixed(2)} ${baseCurrency}
- Total Invested: ${portfolio.total_invested.toFixed(2)} ${baseCurrency}
- Total Profit/Loss: ${portfolio.total_profit_loss.toFixed(2)} ${baseCurrency}
- Current ROI: ${currentROI.toFixed(2)}%

HISTORICAL INVESTMENT RETURNS (${monthsOfData} months of data):
- Total Returns Received: ${totalReturnsBase.toFixed(2)} ${baseCurrency}
- Average Monthly Returns: ${avgMonthlyReturns.toFixed(2)} ${baseCurrency}
- Breakdown by Type:
${returns.map(r => `  • ${r.return_type}: ${r.count} payments, Total: ${r.total} ${r.currency}`).join('\n')}

CURRENT ASSET ALLOCATION:
${Object.entries(portfolio.by_type).map(([type, count]) => `- ${type}: ${count} investments`).join('\n')}

SAVINGS AVAILABLE FOR REINVESTMENT:
- Current Savings: ${totalSavingsBase.toFixed(2)} ${baseCurrency}

IMPORTANT ASSUMPTIONS FOR FORECASTING:
1. Investment returns (dividends, interest, bonds) will continue at the historical average rate
2. All returns received will be added to SAVINGS accounts
3. Portfolio growth rate is calculated from Current Amount - Invested Amount
4. Use both the current ROI rate and historical returns pattern for projections

Based on this data, provide detailed 12-month projections:

1. CONSERVATIVE SCENARIO (worst case):
   - Expected portfolio value
   - Expected returns to be received
   - How returns will accumulate in savings
   - Growth rate assumption

2. MODERATE SCENARIO (likely case):
   - Expected portfolio value
   - Expected returns to be received
   - How returns will accumulate in savings
   - Growth rate assumption

3. OPTIMISTIC SCENARIO (best case):
   - Expected portfolio value
   - Expected returns to be received
   - How returns will accumulate in savings
   - Growth rate assumption

4. SAVINGS GROWTH IMPACT:
   - Show how savings will grow from reinvested returns
   - Suggest optimal reallocation from savings to higher-yield investments

Provide specific numbers in ${baseCurrency} for each scenario.`;

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 2000,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const projections = message.content[0].text;

        // Save to database
        runQuery(
            `INSERT INTO ai_insights (insight_type, content, portfolio_snapshot, generated_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            ['future_projections', projections, JSON.stringify({ portfolio, returns })]
        );

        console.log('✅ Projections generated');

        return { projections };
    } catch (error) {
        console.error('Projection generation failed:', error);
        throw error;
    }
}

/**
 * Get recent AI insights
 */
export function getRecentInsights(limit = 10) {
    return getAll(
        `SELECT id, insight_type, content, generated_at
         FROM ai_insights
         ORDER BY generated_at DESC
         LIMIT ?`,
        [limit]
    );
}
