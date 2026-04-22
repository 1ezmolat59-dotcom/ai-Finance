'use server';

import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

/**
 * getExpenses({ source, category, dateFrom, dateTo, limit, offset })
 *
 * Unified query for all expenses — manual + Plaid — from the expenses table.
 * Use this in your dashboard instead of querying expenses directly.
 */
export async function getExpenses({
  source,           // 'manual' | 'plaid' | undefined (all)
  category,         // filter by category string
  dateFrom,         // 'YYYY-MM-DD'
  dateTo,           // 'YYYY-MM-DD'
  pending,          // true | false | undefined
  limit = 50,
  offset = 0,
} = {}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let query = supabase
    .from('expenses_with_account')   // uses the view created in migration
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (source)   query = query.eq('source', source);
  if (category) query = query.eq('category', category);
  if (dateFrom) query = query.gte('date', dateFrom);
  if (dateTo)   query = query.lte('date', dateTo);
  if (pending !== undefined) query = query.eq('pending', pending);

  const { data, error, count } = await query;
  if (error) throw error;

  return { expenses: data, total: count };
}

/**
 * getExpenseSummary({ dateFrom, dateTo })
 *
 * Returns total spend by category for the given period,
 * broken out by source (manual vs plaid).
 */
export async function getExpenseSummary({ dateFrom, dateTo } = {}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let query = supabase
    .from('expenses')
    .select('category, source, amount, pending')
    .eq('user_id', user.id)
    .eq('pending', false); // exclude pending transactions from totals

  if (dateFrom) query = query.gte('date', dateFrom);
  if (dateTo)   query = query.lte('date', dateTo);

  const { data, error } = await query;
  if (error) throw error;

  // Aggregate in JS — swap for a Supabase RPC if perf matters at scale
  const byCategory = {};
  let grandTotal = 0;

  for (const row of data) {
    if (!byCategory[row.category]) {
      byCategory[row.category] = { category: row.category, total: 0, manual: 0, plaid: 0 };
    }
    byCategory[row.category].total += row.amount;
    byCategory[row.category][row.source] += row.amount;
    grandTotal += row.amount;
  }

  const categories = Object.values(byCategory).sort((a, b) => b.total - a.total);

  return { categories, grandTotal };
}

/**
 * updateExpenseCategory(expenseId, category)
 *
 * Lets users reclassify a Plaid-imported transaction.
 * Safe — only updates if the expense belongs to the current user.
 */
export async function updateExpenseCategory(expenseId, category) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('expenses')
    .update({ category })
    .eq('id', expenseId)
    .eq('user_id', user.id);

  if (error) throw error;
  return { success: true };
}

/**
 * deleteExpense(expenseId)
 *
 * Soft-deletes a Plaid expense by removing it from the expenses table.
 * On next sync, Plaid won't re-import it (we check plaid_transaction_id).
 * For manual expenses, just deletes.
 */
export async function deleteExpense(expenseId) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', user.id);

  if (error) throw error;
  return { success: true };
}
