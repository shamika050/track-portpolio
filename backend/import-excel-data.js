import { importExcelData } from './src/utils/excelParser.js';
import db, { closeDatabase } from './src/db/database.js';
import { join } from 'path';

const excelFilePath = join(process.cwd(), '../excel/portpolio_app_improved.xlsx');

console.log('📂 Importing Excel data...');
console.log(`File: ${excelFilePath}`);

try {
    const result = await importExcelData(excelFilePath, db);
    console.log('\n✅ Import completed successfully!');
    console.log(`Imported ${result.investments} investments and ${result.returns} returns`);
} catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error);
    process.exit(1);
} finally {
    closeDatabase();
}
