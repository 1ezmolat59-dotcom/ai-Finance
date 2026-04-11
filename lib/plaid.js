import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const env = process.env.PLAID_ENV || 'sandbox'; // 'sandbox' | 'development' | 'production'

const configuration = new Configuration({
  basePath: PlaidEnvironments[env],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

/**
 * Map Plaid account data to our DB shape
 */
export function mapPlaidAccount(account, plaidItemDbId, userId) {
  return {
    user_id: userId,
    plaid_item_id: plaidItemDbId,
    plaid_account_id: account.account_id,
    name: account.name,
    official_name: account.official_name,
    type: account.type,
    subtype: account.subtype,
    mask: account.mask,
    current_balance: account.balances.current,
    available_balance: account.balances.available,
    iso_currency_code: account.balances.iso_currency_code || 'USD',
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Map Plaid transaction data to our DB shape
 */
export function mapPlaidTransaction(tx, plaidAccountDbId, userId) {
  return {
    user_id: userId,
    plaid_account_id: plaidAccountDbId,
    plaid_transaction_id: tx.transaction_id,
    amount: tx.amount,
    date: tx.date,
    name: tx.name,
    merchant_name: tx.merchant_name,
    category: tx.category,
    personal_finance_category: tx.personal_finance_category?.primary,
    pending: tx.pending,
    payment_channel: tx.payment_channel,
    logo_url: tx.logo_url,
    website: tx.website,
    iso_currency_code: tx.iso_currency_code || 'USD',
    raw_data: tx,
  };
}
