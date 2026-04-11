/**
 * plaid-to-expenses.js
 *
 * Maps Plaid transaction objects → expenses table rows.
 * Plaid amounts: positive = money out (debit), negative = money in (credit).
 * We only import debits as expenses (positive amounts).
 */

/**
 * Plaid's personal_finance_category → your app's expense category.
 * Extend this map to match whatever categories you use in Finance-AI.
 */
const CATEGORY_MAP = {
  FOOD_AND_DRINK:              'Food & Drink',
  GROCERIES:                   'Groceries',
  RESTAURANTS:                 'Dining',
  TRANSPORTATION:              'Transport',
  TRAVEL:                      'Travel',
  RENT_AND_UTILITIES:          'Utilities',
  UTILITIES:                   'Utilities',
  ENTERTAINMENT:               'Entertainment',
  GENERAL_MERCHANDISE:         'Shopping',
  PERSONAL_CARE:               'Personal Care',
  MEDICAL:                     'Healthcare',
  HEALTHCARE:                  'Healthcare',
  INSURANCE:                   'Insurance',
  LOAN_PAYMENTS:               'Loan',
  BANK_FEES:                   'Bank Fees',
  GOVERNMENT_AND_NON_PROFIT:   'Government',
  HOME_IMPROVEMENT:            'Home',
  INCOME:                      null, // skip income
  TRANSFER_IN:                 null, // skip transfers
  TRANSFER_OUT:                null,
};

/**
 * Convert a Plaid transaction + account DB ID → expense row.
 * Returns null for credits / transfers we don't want to import.
 */
export function plaidTxToExpense(tx, plaidAccountDbId, userId) {
  // Skip credits (money coming in) and transfers
  if (tx.amount <= 0) return null;

  const pfCategory = tx.personal_finance_category?.primary;
  const mappedCategory = pfCategory ? CATEGORY_MAP[pfCategory] : undefined;

  // Skip income and transfer transactions entirely
  if (mappedCategory === null) return null;

  return {
    user_id:                  userId,
    plaid_account_id:         plaidAccountDbId,
    plaid_transaction_id:     tx.transaction_id,
    source:                   'plaid',
    amount:                   tx.amount,
    date:                     tx.date,
    // Use merchant_name if available, fall back to transaction name
    description:              tx.merchant_name || tx.name,
    merchant_name:            tx.merchant_name,
    category:                 mappedCategory || mapLegacyCategory(tx.category),
    personal_finance_category: pfCategory,
    payment_channel:          tx.payment_channel,
    pending:                  tx.pending,
    logo_url:                 tx.logo_url,
    // Don't overwrite notes/tags on existing rows — handled by upsert merge
  };
}

/**
 * Fall back to Plaid's legacy category array if enriched category unavailable.
 * e.g. ["Food and Drink", "Restaurants"] → "Dining"
 */
function mapLegacyCategory(categories) {
  if (!categories?.length) return 'Other';

  const top = categories[0]?.toLowerCase();
  if (top.includes('food') || top.includes('restaurant')) return 'Dining';
  if (top.includes('travel') || top.includes('transport')) return 'Travel';
  if (top.includes('shop') || top.includes('retail')) return 'Shopping';
  if (top.includes('health') || top.includes('medical')) return 'Healthcare';
  if (top.includes('entertain')) return 'Entertainment';
  if (top.includes('util') || top.includes('bill')) return 'Utilities';

  return categories[0] || 'Other';
}

/**
 * Filter a list of Plaid transactions down to importable expenses.
 * Returns { toUpsert: expense[], skipped: number }
 */
export function filterAndMapExpenses(transactions, accountMap, userId) {
  const toUpsert = [];
  let skipped = 0;

  for (const tx of transactions) {
    const accountDbId = accountMap[tx.account_id];
    if (!accountDbId) { skipped++; continue; }

    const expense = plaidTxToExpense(tx, accountDbId, userId);
    if (!expense) { skipped++; continue; }

    toUpsert.push(expense);
  }

  return { toUpsert, skipped };
}
