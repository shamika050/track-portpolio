import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { initializeDatabase } from './db/database.js';

// Import routes
import investmentsRouter from './routes/investments.js';
import portfolioRouter from './routes/portfolio.js';
import importRouter from './routes/import.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, '../uploads');
if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database
console.log('🔧 Initializing database...');
initializeDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Portfolio Tracker API is running' });
});

// API Routes
app.use('/api/investments', investmentsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/import', importRouter);

// Settings endpoints
app.get('/api/settings', async (req, res) => {
    try {
        const { getAll } = await import('./db/database.js');
        const settings = getAll(`SELECT key, value FROM app_settings`);

        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });

        res.json({ success: true, data: settingsObj });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/settings/:key', async (req, res) => {
    try {
        const { runQuery } = await import('./db/database.js');
        const { key } = req.params;
        const { value } = req.body;

        runQuery(
            `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [key, value]
        );

        res.json({ success: true, message: 'Setting updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Portfolio Tracker API Server`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 API Endpoints:`);
    console.log(`   - GET    /api/investments`);
    console.log(`   - GET    /api/portfolio/networth`);
    console.log(`   - POST   /api/portfolio/refresh-rates`);
    console.log(`   - POST   /api/portfolio/refresh-prices`);
    console.log(`   - POST   /api/portfolio/ai-analysis`);
    console.log(`   - POST   /api/import/excel`);
    console.log(`${'='.repeat(60)}\n`);
});

export default app;
