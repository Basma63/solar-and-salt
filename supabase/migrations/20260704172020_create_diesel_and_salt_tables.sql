/*
# Create Fuel and Salt Washing Plant Management Tables

1. New Tables
- `daily_diesel` - Daily diesel records with opening balance, received, distributed, and remaining quantities
- `diesel_transactions` - Individual diesel transactions (received/distributed)
- `daily_salt` - Daily salt washing records with opening balance, production, distributed, and remaining quantities
- `salt_transactions` - Individual salt transactions (production/distributed)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated full access (single-tenant app, no authentication required).

3. Important Notes
- All date fields use DATE type for easy querying by day
- Timestamps track creation/modification times
- Enums are stored as text for simplicity
- Indexes on date columns for efficient daily queries
*/

-- Daily Diesel Summary Table
CREATE TABLE IF NOT EXISTS daily_diesel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    opening_balance numeric(10,2) NOT NULL DEFAULT 0,
    received_today numeric(10,2) NOT NULL DEFAULT 0,
    distributed_today numeric(10,2) NOT NULL DEFAULT 0,
    remaining numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Diesel Transactions Table
CREATE TABLE IF NOT EXISTS diesel_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('received', 'distributed')),
    date date NOT NULL,
    quantity numeric(10,2) NOT NULL,
    supplier text,
    recipient text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Daily Salt Summary Table
CREATE TABLE IF NOT EXISTS daily_salt (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    opening_balance numeric(10,2) NOT NULL DEFAULT 0,
    production_today numeric(10,2) NOT NULL DEFAULT 0,
    distributed_today numeric(10,2) NOT NULL DEFAULT 0,
    remaining numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Salt Transactions Table
CREATE TABLE IF NOT EXISTS salt_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('production', 'distributed')),
    date date NOT NULL,
    operating_hours numeric(10,2),
    production_per_hour numeric(10,2),
    production numeric(10,2),
    quantity numeric(10,2),
    recipient text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient date queries
CREATE INDEX IF NOT EXISTS idx_daily_diesel_date ON daily_diesel(date);
CREATE INDEX IF NOT EXISTS idx_diesel_transactions_date ON diesel_transactions(date);
CREATE INDEX IF NOT EXISTS idx_daily_salt_date ON daily_salt(date);
CREATE INDEX IF NOT EXISTS idx_salt_transactions_date ON salt_transactions(date);

-- Enable RLS on all tables
ALTER TABLE daily_diesel ENABLE ROW LEVEL SECURITY;
ALTER TABLE diesel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_salt ENABLE ROW LEVEL SECURITY;
ALTER TABLE salt_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_diesel
DROP POLICY IF EXISTS "anon_select_daily_diesel" ON daily_diesel;
CREATE POLICY "anon_select_daily_diesel" ON daily_diesel FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_daily_diesel" ON daily_diesel;
CREATE POLICY "anon_insert_daily_diesel" ON daily_diesel FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_daily_diesel" ON daily_diesel;
CREATE POLICY "anon_update_daily_diesel" ON daily_diesel FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_daily_diesel" ON daily_diesel;
CREATE POLICY "anon_delete_daily_diesel" ON daily_diesel FOR DELETE
    TO anon, authenticated USING (true);

-- RLS Policies for diesel_transactions
DROP POLICY IF EXISTS "anon_select_diesel_transactions" ON diesel_transactions;
CREATE POLICY "anon_select_diesel_transactions" ON diesel_transactions FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_diesel_transactions" ON diesel_transactions;
CREATE POLICY "anon_insert_diesel_transactions" ON diesel_transactions FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_diesel_transactions" ON diesel_transactions;
CREATE POLICY "anon_update_diesel_transactions" ON diesel_transactions FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_diesel_transactions" ON diesel_transactions;
CREATE POLICY "anon_delete_diesel_transactions" ON diesel_transactions FOR DELETE
    TO anon, authenticated USING (true);

-- RLS Policies for daily_salt
DROP POLICY IF EXISTS "anon_select_daily_salt" ON daily_salt;
CREATE POLICY "anon_select_daily_salt" ON daily_salt FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_daily_salt" ON daily_salt;
CREATE POLICY "anon_insert_daily_salt" ON daily_salt FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_daily_salt" ON daily_salt;
CREATE POLICY "anon_update_daily_salt" ON daily_salt FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_daily_salt" ON daily_salt;
CREATE POLICY "anon_delete_daily_salt" ON daily_salt FOR DELETE
    TO anon, authenticated USING (true);

-- RLS Policies for salt_transactions
DROP POLICY IF EXISTS "anon_select_salt_transactions" ON salt_transactions;
CREATE POLICY "anon_select_salt_transactions" ON salt_transactions FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_salt_transactions" ON salt_transactions;
CREATE POLICY "anon_insert_salt_transactions" ON salt_transactions FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_salt_transactions" ON salt_transactions;
CREATE POLICY "anon_update_salt_transactions" ON salt_transactions FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_salt_transactions" ON salt_transactions;
CREATE POLICY "anon_delete_salt_transactions" ON salt_transactions FOR DELETE
    TO anon, authenticated USING (true);