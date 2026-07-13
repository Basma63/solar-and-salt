/*
# Continuous Diesel Inventory Support

1. Changes to existing tables
- `diesel_transactions`: add `transaction_time` (time) column so each transaction stores both a date AND a time, as required by the new warehouse-style inventory.
  - The column is nullable so existing rows are not affected.
  - Added an index on (date, transaction_time) for efficient ordering.

2. New Tables
- `diesel_meta` — single-row table holding the initial opening balance for the entire diesel inventory (the manually-set starting quantity before the first transaction). This replaces the old per-day `opening_balance` concept with a single continuous inventory anchor.
  - `id` (int, primary key, always 1)
  - `initial_balance` (numeric, default 0) — the starting inventory quantity.

3. Security
- `diesel_meta` has RLS enabled with anon+authenticated full CRUD (single-tenant, no auth app), matching the existing tables.

4. Important Notes
- The existing `daily_diesel` table is NOT dropped or altered — existing data is preserved.
- `daily_diesel` rows will be recomputed from transactions going forward, so the old per-day records become a derived cache rather than the source of truth.
- `diesel_meta.initial_balance` is the single anchor point: the inventory on the day before the earliest transaction is this value, and every subsequent day's opening balance is the previous day's closing balance.
*/

-- Add transaction_time column to diesel_transactions
ALTER TABLE diesel_transactions
  ADD COLUMN IF NOT EXISTS transaction_time time;

-- Index for efficient date+time ordering
CREATE INDEX IF NOT EXISTS idx_diesel_transactions_date_time
  ON diesel_transactions(date, transaction_time);

-- Create diesel_meta table (single-row config table for initial balance)
CREATE TABLE IF NOT EXISTS diesel_meta (
  id int PRIMARY KEY DEFAULT 1,
  initial_balance numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO diesel_meta (id, initial_balance)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on diesel_meta
ALTER TABLE diesel_meta ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diesel_meta (single-tenant, no auth)
DROP POLICY IF EXISTS "anon_select_diesel_meta" ON diesel_meta;
CREATE POLICY "anon_select_diesel_meta" ON diesel_meta FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_diesel_meta" ON diesel_meta;
CREATE POLICY "anon_insert_diesel_meta" ON diesel_meta FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_diesel_meta" ON diesel_meta;
CREATE POLICY "anon_update_diesel_meta" ON diesel_meta FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_diesel_meta" ON diesel_meta;
CREATE POLICY "anon_delete_diesel_meta" ON diesel_meta FOR DELETE
  TO anon, authenticated USING (true);
