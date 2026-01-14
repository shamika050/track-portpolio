const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Sample Investments Data for "Networth" sheet
// Expected columns: ID, Platform, Investment Type, Ticker Symbol, Asset Name, Invested Amount, Current Amount, Profit/Loss, Currency, Updated Date, Purchase Date, Quantity, Auto Update, Notes
const investments = [
    ['ID', 'Platform', 'Investment Type', 'Ticker Symbol', 'Asset Name', 'Invested Amount', 'Current Amount', 'Profit/Loss', 'Currency', 'Updated Date', 'Purchase Date', 'Quantity', 'Auto Update', 'Notes'],
    ['INV001', 'CommSec', 'STOCK', 'CBA.AX', 'Commonwealth Bank', 15000, 18500, '=G2-F2', 'AUD', '2025-12-01', '2023-06-15', 50, 'YES', 'Australian bank stock'],
    ['INV002', 'Interactive Brokers', 'ETF', 'VOO', 'Vanguard S&P 500 ETF', 25000, 32000, '=G3-F3', 'USD', '2025-12-05', '2023-03-20', 80, 'YES', 'US market ETF'],
    ['INV003', 'Coinbase', 'CRYPTO', 'BTC', 'Bitcoin', 8000, 12500, '=G4-F4', 'USD', '2025-12-10', '2024-01-10', 0.15, 'YES', 'Cryptocurrency'],
    ['INV004', 'ING Direct', 'SAVING', 'N/A', 'High Interest Savings', 50000, 51250, '=G5-F5', 'AUD', '2025-12-15', '2023-01-05', 1, 'NO', 'Savings account 2.5% p.a.'],
    ['INV005', 'CommSec', 'BOND', 'GSBE29', 'Australian Government Bond', 20000, 20800, '=G6-F6', 'AUD', '2025-11-20', '2023-08-12', 20, 'NO', '10-year treasury bond'],
    ['INV006', 'Vanguard', 'ETF', 'VWO', 'Vanguard Emerging Markets', 12000, 14200, '=G7-F7', 'USD', '2025-12-01', '2023-05-18', 200, 'YES', 'Emerging markets exposure'],
    ['INV007', 'Robinhood', 'STOCK', 'TSLA', 'Tesla Inc', 10000, 9200, '=G8-F8', 'USD', '2025-12-08', '2024-06-25', 40, 'YES', 'EV manufacturer'],
    ['INV008', 'ANZ Bank', 'FD', 'N/A', 'Fixed Deposit', 30000, 31200, '=G9-F9', 'AUD', '2025-12-12', '2024-06-12', 1, 'NO', '12-month term deposit 4% p.a.'],
    ['INV009', 'Binance', 'CRYPTO', 'ETH', 'Ethereum', 6000, 7800, '=G10-F10', 'USD', '2025-12-14', '2024-02-15', 3.5, 'YES', 'Smart contract platform'],
    ['INV010', 'Interactive Brokers', 'ETF', 'IWDA.L', 'iShares MSCI World', 18000, 21500, '=G11-F11', 'SGD', '2025-11-28', '2023-09-10', 100, 'YES', 'Global equities'],
    ['INV011', 'eToro', 'STOCK', 'AAPL', 'Apple Inc', 14000, 16800, '=G12-F12', 'USD', '2025-12-03', '2023-11-20', 90, 'YES', 'Technology leader'],
    ['INV012', 'AustralianSuper', 'SUPER', 'N/A', 'Superannuation Fund', 85000, 92000, '=G13-F13', 'AUD', '2025-12-01', '2020-01-01', 1, 'NO', 'Balanced growth option'],
    ['INV013', 'NABTrade', 'BOND', 'WBCPH', 'Corporate Bond - Westpac', 25000, 25750, '=G14-F14', 'AUD', '2025-11-25', '2024-03-05', 25, 'NO', 'Investment grade corporate bond'],
    ['INV014', 'Vanguard', 'ETF', 'VAS.AX', 'Vanguard Australian Shares', 22000, 24500, '=G15-F15', 'AUD', '2025-12-07', '2023-07-14', 120, 'YES', 'ASX 300 index'],
    ['INV015', 'Commercial Bank', 'BOND', 'T-BILL', 'Sri Lanka Treasury Bill', 1500000, 1625000, '=G16-F16', 'LKR', '2025-11-30', '2024-05-20', 15, 'NO', '6-month treasury bill'],
    ['INV016', 'Charles Schwab', 'STOCK', 'MSFT', 'Microsoft Corp', 16000, 19500, '=G17-F17', 'USD', '2025-12-09', '2023-10-08', 55, 'YES', 'Cloud computing leader'],
    ['INV017', 'Westpac', 'FD', 'N/A', 'Term Deposit', 40000, 41600, '=G18-F18', 'AUD', '2025-12-11', '2024-08-11', 1, 'NO', '6-month term deposit 4.2% p.a.'],
    ['INV018', 'Vanguard', 'FUND', 'N/A', 'Managed Growth Fund', 35000, 38200, '=G19-F19', 'AUD', '2025-12-13', '2023-04-22', 1, 'NO', 'Diversified growth portfolio'],
];

// Sample Investment Returns Data
// Expected columns: Investment ID, Stock/Instrument, Return Type, Date, Amount, Currency, Notes
const returns = [
    ['Investment ID', 'Stock/Instrument', 'Return Type', 'Date', 'Amount', 'Currency', 'Notes'],
    ['INV001', 'CBA.AX', 'DIVIDEND', '2025-11-15', 450, 'AUD', 'Quarterly dividend'],
    ['INV002', 'VOO', 'DIVIDEND', '2025-10-20', 320, 'USD', 'Quarterly distribution'],
    ['INV004', 'N/A', 'INTEREST', '2025-11-30', 125, 'AUD', 'Monthly interest'],
    ['INV005', 'GSBE29', 'BOND', '2025-11-20', 400, 'AUD', 'Semi-annual coupon'],
    ['INV006', 'VWO', 'DIVIDEND', '2025-09-30', 180, 'USD', 'Quarterly dividend'],
    ['INV008', 'N/A', 'INTEREST', '2025-12-01', 300, 'AUD', 'Term deposit interest'],
    ['INV010', 'IWDA.L', 'DIVIDEND', '2025-10-15', 275, 'SGD', 'Quarterly distribution'],
    ['INV011', 'AAPL', 'DIVIDEND', '2025-11-10', 210, 'USD', 'Quarterly dividend'],
    ['INV012', 'N/A', 'INTEREST', '2025-12-01', 850, 'AUD', 'Annual super contribution'],
    ['INV013', 'WBCPH', 'BOND', '2025-11-25', 375, 'AUD', 'Corporate bond interest'],
    ['INV014', 'VAS.AX', 'DIVIDEND', '2025-10-30', 550, 'AUD', 'Quarterly distribution'],
    ['INV015', 'T-BILL', 'INTEREST', '2025-11-30', 62500, 'LKR', 'Treasury bill maturity'],
    ['INV016', 'MSFT', 'DIVIDEND', '2025-11-05', 240, 'USD', 'Quarterly dividend'],
    ['INV017', 'N/A', 'INTEREST', '2025-12-11', 400, 'AUD', 'Term deposit maturity'],
    ['INV018', 'N/A', 'CAPITAL_GAIN', '2025-11-20', 320, 'AUD', 'Fund distribution'],
    ['INV001', 'CBA.AX', 'DIVIDEND', '2025-08-15', 425, 'AUD', 'Quarterly dividend'],
    ['INV002', 'VOO', 'DIVIDEND', '2025-07-20', 310, 'USD', 'Quarterly distribution'],
    ['INV014', 'VAS.AX', 'DIVIDEND', '2025-07-30', 520, 'AUD', 'Quarterly distribution'],
];

// Create workbook
const wb = XLSX.utils.book_new();

// Create Networth worksheet (main investments sheet)
const ws_networth = XLSX.utils.aoa_to_sheet(investments);

// Set column widths for Networth sheet
ws_networth['!cols'] = [
    { wch: 12 },  // ID
    { wch: 20 },  // Platform
    { wch: 18 },  // Investment Type
    { wch: 15 },  // Ticker Symbol
    { wch: 25 },  // Asset Name
    { wch: 18 },  // Invested Amount
    { wch: 18 },  // Current Amount
    { wch: 15 },  // Profit/Loss
    { wch: 12 },  // Currency
    { wch: 15 },  // Updated Date
    { wch: 15 },  // Purchase Date
    { wch: 12 },  // Quantity
    { wch: 12 },  // Auto Update
    { wch: 30 },  // Notes
];

// Create Investment Returns worksheet
const ws_returns = XLSX.utils.aoa_to_sheet(returns);

// Set column widths for Returns sheet
ws_returns['!cols'] = [
    { wch: 15 },  // Investment ID
    { wch: 18 },  // Stock/Instrument
    { wch: 18 },  // Return Type
    { wch: 15 },  // Date
    { wch: 15 },  // Amount
    { wch: 12 },  // Currency
    { wch: 30 },  // Notes
];

// Add worksheets to workbook (sheet name must be "Networth")
XLSX.utils.book_append_sheet(wb, ws_networth, 'Networth');
XLSX.utils.book_append_sheet(wb, ws_returns, 'Investment Returns');

// Write to file
const outputPath = path.join(__dirname, 'portpolio_app_improved_test.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`Test Excel file created successfully at: ${outputPath}`);
console.log('\nSummary:');
console.log('- 18 sample investments across multiple types (STOCK, ETF, CRYPTO, SAVING, BOND, FD, SUPER, FUND)');
console.log('- 18 sample returns (DIVIDEND, INTEREST, BOND, CAPITAL_GAIN)');
console.log('- Multiple currencies (AUD, USD, SGD, LKR)');
console.log('- P/L column uses Excel formulas (=G-F)');
