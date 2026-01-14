import db from './src/db/database.js';
import { parseNetworthSheet } from './src/utils/excelParser.js';
import { join } from 'path';

const excelFilePath = join(process.cwd(), '../excel/portpolio_app_improved.xlsx');

try {
    const investments = await parseNetworthSheet(excelFilePath);
    const inv = investments[0];

    console.log('Testing insert with first investment:');
    console.log(JSON.stringify(inv, null, 2));

    const insertInvestment = db.prepare(`
        INSERT OR REPLACE INTO investments
        (id, platform, investment_type, ticker_symbol, asset_name, invested_amount,
         current_amount, profit_loss, currency, updated_date, purchase_date,
         quantity, auto_update, notes, modified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    console.log('\nValues to insert:');
    const values = [
        inv.id || null,
        inv.platform || null,
        inv.investment_type || null,
        inv.ticker_symbol || null,
        inv.asset_name || null,
        inv.invested_amount || null,
        inv.current_amount || null,
        inv.profit_loss || null,
        inv.currency || null,
        inv.updated_date || null,
        inv.purchase_date || null,
        inv.quantity || null,
        inv.auto_update || null,
        inv.notes || null
    ];

    console.log(values);
    console.log('Number of values:', values.length);

    const result = insertInvestment.run(...values);
    console.log('\n✅ Insert successful!', result);

    // Query to verify
    const check = db.prepare('SELECT * FROM investments WHERE id = ?').get(inv.id);
    console.log('\nInserted record:');
    console.log(check);

} catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
} finally {
    db.close();
}
