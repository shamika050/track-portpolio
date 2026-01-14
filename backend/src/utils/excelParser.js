import ExcelJS from 'exceljs';

/**
 * Parse Networth sheet from Excel file
 */
export async function parseNetworthSheet(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Networth');
    if (!worksheet) {
        throw new Error('Networth sheet not found in Excel file');
    }

    const investments = [];
    const headers = [];

    // Read headers from first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
    });

    // Read data rows
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData = {};
        let hasData = false;

        row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header && cell.value !== null) {
                let cellValue = cell.value;

                // Handle different cell types
                if (typeof cellValue === 'object') {
                    // Hyperlinked cells
                    if (cellValue.text !== undefined) {
                        cellValue = cellValue.text;
                    }
                    // Formula cells with result
                    else if (cellValue.result !== undefined) {
                        cellValue = cellValue.result;
                    }
                    // Shared formula or formula without result - use the actual cell value
                    else if (cellValue.sharedFormula !== undefined || cellValue.formula !== undefined) {
                        // Try to get the calculated value from the cell
                        cellValue = cell.result !== undefined ? cell.result : null;
                    }
                }

                rowData[header] = cellValue;
                hasData = true;
            }
        });

        // Only add rows that have data
        if (hasData && rowData['ID']) {
            // Convert dates to ISO strings
            if (rowData['Updated Date'] instanceof Date) {
                rowData['Updated Date'] = rowData['Updated Date'].toISOString().split('T')[0];
            }
            if (rowData['Purchase Date'] instanceof Date) {
                rowData['Purchase Date'] = rowData['Purchase Date'].toISOString().split('T')[0];
            }

            investments.push({
                id: rowData['ID'],
                platform: rowData['Platform'],
                investment_type: rowData['Investment Type'],
                ticker_symbol: rowData['Ticker Symbol'],
                asset_name: rowData['Asset Name'],
                invested_amount: rowData['Invested Amount'],
                current_amount: rowData['Current Amount'],
                profit_loss: rowData['Profit/Loss'],
                currency: rowData['Currency'],
                updated_date: rowData['Updated Date'],
                purchase_date: rowData['Purchase Date'],
                quantity: rowData['Quantity'],
                auto_update: rowData['Auto Update'],
                notes: rowData['Notes']
            });
        }
    });

    return investments;
}

/**
 * Parse Investment Returns sheet from Excel file
 */
export async function parseReturnsSheet(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Investment Returns');
    if (!worksheet) {
        throw new Error('Investment Returns sheet not found in Excel file');
    }

    const returns = [];
    const headers = [];

    // Read headers from first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
    });

    // Read data rows
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData = {};
        let hasData = false;

        row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header && cell.value !== null && header.trim() !== '') {
                let cellValue = cell.value;

                // Handle different cell types
                if (typeof cellValue === 'object') {
                    // Hyperlinked cells
                    if (cellValue.text !== undefined) {
                        cellValue = cellValue.text;
                    }
                    // Formula cells with result
                    else if (cellValue.result !== undefined) {
                        cellValue = cellValue.result;
                    }
                    // Shared formula or formula without result - use the actual cell value
                    else if (cellValue.sharedFormula !== undefined || cellValue.formula !== undefined) {
                        // Try to get the calculated value from the cell
                        cellValue = cell.result !== undefined ? cell.result : null;
                    }
                }

                rowData[header] = cellValue;
                hasData = true;
            }
        });

        // Only add rows that have data
        if (hasData && rowData['Investment ID'] && rowData['Investment ID'] !== 'TO_BE_LINKED') {
            // Convert dates to ISO strings
            if (rowData['Date'] instanceof Date) {
                rowData['Date'] = rowData['Date'].toISOString().split('T')[0];
            }

            returns.push({
                investment_id: rowData['Investment ID'],
                stock_instrument: rowData['Stock/Instrument'],
                return_type: rowData['Return Type'],
                date: rowData['Date'],
                amount: rowData['Amount'],
                currency: rowData['Currency'],
                notes: rowData['Notes'] || ''
            });
        }
    });

    return returns;
}

/**
 * Import Excel data into database
 */
export async function importExcelData(filePath, db) {
    try {
        console.log('📂 Reading Excel file...');
        const investments = await parseNetworthSheet(filePath);
        const returns = await parseReturnsSheet(filePath);

        console.log(`📊 Found ${investments.length} investments and ${returns.length} returns`);

        // Start transaction
        const insertInvestment = db.prepare(`
            INSERT OR REPLACE INTO investments
            (id, platform, investment_type, ticker_symbol, asset_name, invested_amount,
             current_amount, profit_loss, currency, updated_date, purchase_date,
             quantity, auto_update, notes, modified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        const insertReturn = db.prepare(`
            INSERT INTO investment_returns
            (investment_id, stock_instrument, return_type, date, amount, currency, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        // Clear existing returns (we'll reimport them)
        db.prepare('DELETE FROM investment_returns').run();

        const importTransaction = db.transaction(() => {
            // Insert investments
            for (const inv of investments) {
                try {
                    insertInvestment.run(
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
                    );
                } catch (error) {
                    console.error(`Failed to insert investment ${inv.id}:`, error.message);
                    console.error('Investment data:', JSON.stringify(inv, null, 2));
                    throw error;
                }
            }

            // Insert returns
            for (const ret of returns) {
                insertReturn.run(
                    ret.investment_id || null,
                    ret.stock_instrument || null,
                    ret.return_type || null,
                    ret.date || null,
                    ret.amount || null,
                    ret.currency || null,
                    ret.notes || null
                );
            }
        });

        importTransaction();

        // Update last import timestamp
        db.prepare(`
            INSERT OR REPLACE INTO app_settings (key, value, updated_at)
            VALUES ('last_excel_import', ?, CURRENT_TIMESTAMP)
        `).run(new Date().toISOString());

        console.log('✅ Excel data imported successfully');

        return {
            investments: investments.length,
            returns: returns.length
        };
    } catch (error) {
        console.error('❌ Excel import failed:', error);
        throw error;
    }
}
