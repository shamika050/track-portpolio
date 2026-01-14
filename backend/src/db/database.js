import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../../portfolio.db');

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with schema
export function initializeDatabase() {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    db.exec(schema);

    console.log('✅ Database initialized successfully');
}

// Helper function to run queries
export function runQuery(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.run(params);
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

// Helper function to get single row
export function getOne(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.get(params);
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

// Helper function to get multiple rows
export function getAll(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.all(params);
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

// Helper function for transactions
export function transaction(callback) {
    const trans = db.transaction(callback);
    return trans();
}

// Close database connection
export function closeDatabase() {
    db.close();
    console.log('Database connection closed');
}

export default db;
