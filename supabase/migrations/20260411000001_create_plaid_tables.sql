-- Plaid Items: one row per connected bank (per user)
CREATE TABLE IF NOT EXISTS plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL, -- store encrypted in production via Supabase Vault
  institution_id TEXT,
  institution_name TEXT,
  cursor TEXT, -- for /transactions/sync pagination
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plaid Accounts: checking, savings, etc. linked to an item
CREATE TABLE IF NOT EXISTS plaid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id UUID NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
  plaid_account_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  official_name TEXT,
  type TEXT NOT NULL,         -- depository, credit, investment, etc.
  subtype TEXT,               -- checking, savings, credit card, etc.
  mask TEXT,                  -- last 4 digits
  current_balance NUMERIC(12, 2),
  available_balance NUMERIC(12, 2),
  iso_currency_code TEXT DEFAULT 'USD',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plaid Transactions: raw transaction data from bank
CREATE TABLE IF NOT EXISTS plaid_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_account_id UUID NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,  -- positive = debit, negative = credit
  date DATE NOT NULL,
  name TEXT NOT NULL,              -- merchant / payee name
  merchant_name TEXT,
  category TEXT[],                 -- Plaid's category hierarchy
  personal_finance_category TEXT,  -- Plaid's enriched category
  pending BOOLEAN DEFAULT FALSE,
  payment_channel TEXT,            -- online, in store, other
  logo_url TEXT,
  website TEXT,
  iso_currency_code TEXT DEFAULT 'USD',
  raw_data JSONB,                  -- full Plaid transaction object for future use
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own plaid items"
  ON plaid_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own accounts"
  ON plaid_accounts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions"
  ON plaid_transactions FOR ALL USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_plaid_transactions_user_date ON plaid_transactions(user_id, date DESC);
CREATE INDEX idx_plaid_transactions_account ON plaid_transactions(plaid_account_id);
CREATE INDEX idx_plaid_accounts_item ON plaid_accounts(plaid_item_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_plaid_items_updated_at BEFORE UPDATE ON plaid_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plaid_accounts_updated_at BEFORE UPDATE ON plaid_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plaid_transactions_updated_at BEFORE UPDATE ON plaid_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
