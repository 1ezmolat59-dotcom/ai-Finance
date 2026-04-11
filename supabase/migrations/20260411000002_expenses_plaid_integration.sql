-- Extend existing expenses table with Plaid source tracking
-- Using IF NOT EXISTS guards so it's safe to run on any environment

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'plaid')),
  ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS plaid_account_id UUID REFERENCES plaid_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merchant_name TEXT,
  ADD COLUMN IF NOT EXISTS payment_channel TEXT,
  ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS personal_finance_category TEXT;

-- Index for fast Plaid dedup lookups
CREATE INDEX IF NOT EXISTS idx_expenses_plaid_transaction_id
  ON expenses(plaid_transaction_id)
  WHERE plaid_transaction_id IS NOT NULL;

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_expenses_source
  ON expenses(user_id, source);

-- Helper view: all expenses with account info for the dashboard
CREATE OR REPLACE VIEW expenses_with_account AS
SELECT
  e.*,
  pa.name          AS account_name,
  pa.mask          AS account_mask,
  pa.subtype       AS account_subtype,
  pi.institution_name
FROM expenses e
LEFT JOIN plaid_accounts pa ON pa.id = e.plaid_account_id
LEFT JOIN plaid_items    pi ON pi.id = pa.plaid_item_id;
