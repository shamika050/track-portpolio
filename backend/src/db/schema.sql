-- Investment Portfolio Tracker Database Schema

-- Investments Table
CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    platform TEXT,
    investment_type TEXT,
    ticker_symbol TEXT,
    asset_name TEXT,
    invested_amount REAL,
    current_amount REAL,
    profit_loss REAL,
    currency TEXT,
    updated_date TEXT,
    purchase_date TEXT,
    quantity REAL,
    auto_update TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    modified_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Investment Returns Table
CREATE TABLE IF NOT EXISTS investment_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_id TEXT,
    stock_instrument TEXT,
    return_type TEXT,
    date TEXT,
    amount REAL,
    currency TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
);

-- Exchange Rates Cache Table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate REAL NOT NULL,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency)
);

-- Stock Prices Cache Table
CREATE TABLE IF NOT EXISTS stock_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker_symbol TEXT NOT NULL UNIQUE,
    current_price REAL NOT NULL,
    currency TEXT NOT NULL,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights History Table
CREATE TABLE IF NOT EXISTS ai_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight_type TEXT NOT NULL,
    content TEXT NOT NULL,
    portfolio_snapshot TEXT,
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Application Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(investment_type);
CREATE INDEX IF NOT EXISTS idx_investments_currency ON investments(currency);
CREATE INDEX IF NOT EXISTS idx_investments_auto_update ON investments(auto_update);
CREATE INDEX IF NOT EXISTS idx_returns_investment_id ON investment_returns(investment_id);
CREATE INDEX IF NOT EXISTS idx_returns_date ON investment_returns(date);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);

-- Insert default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('base_currency', 'AUD');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('last_excel_import', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('last_rates_update', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('last_prices_update', '');
