import { initializeDatabase, closeDatabase } from './database.js';

console.log('Initializing database...');

try {
    initializeDatabase();
    console.log('✅ Database setup complete!');
} catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
} finally {
    closeDatabase();
}
