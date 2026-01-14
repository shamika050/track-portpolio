import { parseNetworthSheet } from './src/utils/excelParser.js';
import { join } from 'path';

const excelFilePath = join(process.cwd(), '../excel/portpolio_app_improved.xlsx');

try {
    const investments = await parseNetworthSheet(excelFilePath);

    console.log(`Found ${investments.length} investments`);
    console.log('\nFirst investment:');
    const first = investments[0];
    console.log(JSON.stringify(first, null, 2));

    console.log('\nKeys:', Object.keys(first));
    console.log('Number of keys:', Object.keys(first).length);

} catch (error) {
    console.error('Error:', error);
}
