# Profit/Loss Calculation Updates

## Changes Made

### 1. ✅ Profit/Loss Calculation (Backend)

**Updated files:**
- `backend/src/routes/portfolio.js` - Net worth endpoint
- `backend/src/services/ai.js` - Portfolio summary and projections

**Changes:**
- P/L is now **calculated** as `Current Amount - Invested Amount`
- No longer relies on the `profit_loss` field from Excel
- ROI is calculated as `(P/L / Invested) × 100`

**Before:**
```javascript
if (inv.profit_loss) {
    totalProfitLoss += inv.profit_loss;  // Used stored value
}
```

**After:**
```javascript
if (inv.invested_amount && inv.current_amount) {
    const profitLoss = inv.current_amount - inv.invested_amount;  // Calculate on-the-fly
    totalProfitLoss += profitLoss;
}
```

### 2. ✅ AI Forecasting Enhanced

**Updated:** `backend/src/services/ai.js` - `generateProjections()` function

**New forecasting logic:**
- Analyzes historical investment returns (dividends, interest, bonds)
- Calculates average monthly returns from your actual data
- Assumes all returns will be added to SAVINGS
- Uses both current ROI rate AND historical return patterns
- Provides specific projections for savings growth

**Key metrics now included:**
- Total returns received (historical)
- Average monthly returns
- Current savings amount
- Projected savings growth from reinvested returns

**Example prompt to Claude AI:**
```
HISTORICAL INVESTMENT RETURNS (12 months of data):
- Total Returns Received: 5,234.50 AUD
- Average Monthly Returns: 436.21 AUD
- All returns assumed to go to SAVINGS accounts

SAVINGS AVAILABLE FOR REINVESTMENT:
- Current Savings: 37,702.84 AUD

PROJECTIONS:
1. Conservative: Savings will grow by ~5,234 AUD (returns)
2. Moderate: Savings will grow by ~5,500 AUD (returns + modest growth)
3. Optimistic: Savings will grow by ~6,000 AUD (returns + good growth)
```

### 3. ✅ Excel Formula Handling Fixed

**Updated:** `backend/src/utils/excelParser.js`

**Now handles:**
- ✅ Regular formulas: `{formula: "=G2-F2", result: 100}`
- ✅ Shared formulas: `{sharedFormula: "H27"}`
- ✅ Hyperlinked cells: `{text: "AAPL", hyperlink: "..."}`

**This means you can:**
- Keep using Excel formulas for P/L calculations
- The importer will extract the calculated values
- Copy formulas down (shared formulas) - works perfectly

## How It Works Now

### Profit/Loss Flow:

1. **In Excel:**
   - You can have a formula like `=(Current-Invested)/Invested*100`
   - OR just leave it blank
   - OR manually enter a value

2. **During Import:**
   - Parser extracts the calculated value from formulas
   - Stores all values in database

3. **In Application:**
   - Backend **recalculates** P/L as `Current - Invested`
   - Ignores the stored `profit_loss` value
   - Always uses live calculation based on current amounts

4. **Result:**
   - Your Excel formulas are preserved
   - But the app always uses fresh calculations
   - More accurate and up-to-date

### Investment Returns Flow:

1. **Returns are tracked separately** in `investment_returns` table
2. **AI forecasting:**
   - Analyzes your historical returns (dividends, interest, etc.)
   - Calculates average monthly income from returns
   - Projects future returns based on historical patterns
   - Assumes returns accumulate in SAVINGS

3. **Projections consider:**
   - Portfolio capital appreciation (Current vs Invested)
   - Income from returns (dividends, interest, bonds)
   - Both sources contribute to total growth

## Testing the Changes

### 1. Restart Backend
```bash
cd backend
npm run dev
```

### 2. Test P/L Calculation
```bash
curl 'http://localhost:5001/api/portfolio/networth?baseCurrency=AUD'
```

Should show:
- `total_profit_loss`: Calculated as sum of (Current - Invested)
- `roi_percentage`: Calculated as (P/L / Invested) × 100

### 3. Test AI Projections
```bash
curl -X POST 'http://localhost:5001/api/portfolio/ai-projections' \
  -H 'Content-Type: application/json' \
  -d '{"baseCurrency": "AUD"}'
```

Should provide:
- Historical returns analysis
- Average monthly returns
- Savings growth projections
- Specific numbers for 3 scenarios

### 4. View in Frontend
1. Go to http://localhost:3000
2. Dashboard shows calculated P/L and ROI
3. AI Insights → Future Projections tab
4. Click "Generate Projections"
5. See detailed forecast with returns impact

## Important Notes

### Excel File Requirements:

**For accurate P/L calculation:**
- `Invested Amount` - Must be filled
- `Current Amount` - Must be filled (or will auto-update for stocks)
- `Profit/Loss` - Can be a formula, blank, or any value (won't be used)

**For accurate forecasting:**
- Link returns to investments via `Investment ID`
- Ensure return dates are accurate
- All return amounts should be in correct currency

### Formula vs Calculated P/L:

**Scenario:** Your Excel has `P/L = 100` (from formula)

**What happens:**
1. Import reads formula result (100) and stores it
2. Backend calculates: `Current (1200) - Invested (1000) = 200`
3. API returns `200` (not 100)
4. Frontend displays `200`

**Why?** The app always uses live calculation for accuracy.

### Future Returns Assumption:

When AI generates projections, it assumes:
- Historical return rate will continue
- All returns (dividends, interest) go to SAVINGS
- No returns are spent or reinvested in other assets
- This is configurable in the AI prompt if you want different assumptions

## Example Output

### Before Changes:
```json
{
  "profit_loss": 2179.83,  // From Excel formula
  "roi_percentage": "11.67%"  // Based on formula value
}
```

### After Changes:
```json
{
  "profit_loss": 2179.83,  // Calculated: 20859.83 - 18680 = 2179.83
  "roi_percentage": "11.67%",  // Calculated: (2179.83 / 18680) × 100
  "calculation_method": "live"  // Always fresh calculation
}
```

### AI Projections Output:
```
MODERATE SCENARIO (12 months):
- Starting Portfolio: 256,421 AUD
- Portfolio Growth: +15,385 AUD (6% ROI)
- Investment Returns: +5,234 AUD (historical average)
- Ending Portfolio: 277,040 AUD

SAVINGS IMPACT:
- Current Savings: 37,702 AUD
- Returns Added: 5,234 AUD
- Projected Savings: 42,936 AUD
- Recommendation: Consider moving 20,000 AUD to higher-yield investments
```

---

## Summary

✅ **P/L is now calculated**, not stored
✅ **ROI uses live calculations**
✅ **AI forecasting includes returns data**
✅ **Returns assumed to accumulate in savings**
✅ **More accurate projections**

The application now provides more accurate financial tracking with proper P/L calculations and realistic forecasting based on your actual investment returns history!
