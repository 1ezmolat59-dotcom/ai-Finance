import { NextResponse } from 'next/server';
import { plaidClient, mapPlaidTransaction } from '@/lib/plaid';
import { filterAndMapExpenses } from '@/lib/plaid-to-expenses';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/plaid/sync-transactions
 * Syncs new/updated/removed transactions for all of the user's linked items.
 * Uses Plaid's /transactions/sync for cursor-based incremental updates.
 * Also writes importable transactions to the expenses table.
 */
export async function POST() {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active Plaid items for this user
    const { data: items, error: itemsError } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (itemsError) throw itemsError;
    if (!items?.length) {
      return NextResponse.json({ message: 'No linked accounts found', synced: 0 });
    }

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;
    let totalExpensesImported = 0;

    for (const item of items) {
      try {
        // Paginate through all pages of changes using cursor
        let cursor = item.cursor;
        let hasMore = true;
        const added = [];
        const modified = [];
        const removed = [];

        while (hasMore) {
          const response = await plaidClient.transactionsSync({
            access_token: item.access_token,
            cursor: cursor || undefined,
            count: 500,
          });

          const data = response.data;
          added.push(...data.added);
          modified.push(...data.modified);
          removed.push(...data.removed);
          hasMore = data.has_more;
          cursor = data.next_cursor;
        }

        // Fetch account mapping for this item
        const { data: accounts } = await supabase
          .from('plaid_accounts')
          .select('id, plaid_account_id')
          .eq('plaid_item_id', item.id);

        const accountMap = Object.fromEntries(
          accounts.map((a) => [a.plaid_account_id, a.id])
        );

        // ── 1. Upsert raw plaid_transactions ───────────────────────────────
        const allChanged = [...added, ...modified];

        const rawRows = allChanged
          .filter((tx) => accountMap[tx.account_id])
          .map((tx) => mapPlaidTransaction(tx, accountMap[tx.account_id], user.id));

        if (rawRows.length > 0) {
          const { error: rawError } = await supabase
            .from('plaid_transactions')
            .upsert(rawRows, { onConflict: 'plaid_transaction_id' });
          if (rawError) throw rawError;
        }

        // ── 2. Write importable transactions to expenses ───────────────────
        const { toUpsert: expenseRows } = filterAndMapExpenses(
          allChanged,
          accountMap,
          user.id
        );

        if (expenseRows.length > 0) {
          const { error: expError } = await supabase
            .from('expenses')
            .upsert(expenseRows, {
              onConflict: 'plaid_transaction_id',
              // Don't overwrite user edits (notes, tags, manual category changes)
              ignoreDuplicates: false,
            });
          if (expError) throw expError;
          totalExpensesImported += expenseRows.length;
        }

        // ── 3. Remove deleted transactions from both tables ────────────────
        if (removed.length > 0) {
          const removedIds = removed.map((r) => r.transaction_id);

          await Promise.all([
            supabase
              .from('plaid_transactions')
              .delete()
              .in('plaid_transaction_id', removedIds)
              .eq('user_id', user.id),
            supabase
              .from('expenses')
              .delete()
              .in('plaid_transaction_id', removedIds)
              .eq('user_id', user.id),
          ]);
        }

        // ── 4. Save updated cursor ─────────────────────────────────────────
        await supabase
          .from('plaid_items')
          .update({ cursor, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        // ── 5. Refresh account balances ────────────────────────────────────
        const balanceResponse = await plaidClient.accountsGet({
          access_token: item.access_token,
        });

        for (const acct of balanceResponse.data.accounts) {
          if (accountMap[acct.account_id]) {
            await supabase
              .from('plaid_accounts')
              .update({
                current_balance: acct.balances.current,
                available_balance: acct.balances.available,
                last_synced_at: new Date().toISOString(),
              })
              .eq('plaid_account_id', acct.account_id);
          }
        }

        totalAdded += added.length;
        totalModified += modified.length;
        totalRemoved += removed.length;
      } catch (itemError) {
        console.error(`Error syncing item ${item.plaid_item_id}:`, itemError);
        const errorCode = itemError.response?.data?.error_code;
        await supabase
          .from('plaid_items')
          .update({ status: 'error', error_code: errorCode })
          .eq('id', item.id);
      }
    }

    return NextResponse.json({
      success: true,
      added: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
      expenses_imported: totalExpensesImported,
    });
  } catch (error) {
    console.error('Plaid sync-transactions error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
