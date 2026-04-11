import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { plaidClient, mapPlaidTransaction } from '@/lib/plaid';
import { filterAndMapExpenses } from '@/lib/plaid-to-expenses';

/**
 * POST /api/plaid/admin-sync
 *
 * Service-role endpoint for scheduled/background syncs.
 * Syncs ALL active Plaid items across all users — no user session needed.
 *
 * Auth: requires INTERNAL_API_SECRET header.
 * Call this from a cron job or scheduled task, NOT from the browser.
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  // Accept either:
  //   1. Vercel Cron auth:    Authorization: Bearer <CRON_SECRET>
  //   2. Internal secret:     x-internal-secret: <INTERNAL_API_SECRET>
  const authHeader = request.headers.get('authorization');
  const internalSecret = request.headers.get('x-internal-secret');

  const validVercelCron =
    authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const validInternal =
    internalSecret && internalSecret === process.env.INTERNAL_API_SECRET;

  if (!validVercelCron && !validInternal) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Optionally scope to a single user_id (passed in body)
  const body = await request.json().catch(() => ({}));
  const targetUserId = body.user_id;

  let query = supabaseAdmin
    .from('plaid_items')
    .select('*')
    .eq('status', 'active');

  if (targetUserId) query = query.eq('user_id', targetUserId);

  const { data: items, error: itemsError } = await query;
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  if (!items?.length) {
    return NextResponse.json({ message: 'No active items to sync', synced: 0 });
  }

  const results = { synced: 0, errors: 0, added: 0, modified: 0, removed: 0, expenses_imported: 0 };

  for (const item of items) {
    try {
      let cursor = item.cursor;
      let hasMore = true;
      const added = [], modified = [], removed = [];

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

      // Account map
      const { data: accounts } = await supabaseAdmin
        .from('plaid_accounts')
        .select('id, plaid_account_id')
        .eq('plaid_item_id', item.id);

      const accountMap = Object.fromEntries(accounts.map((a) => [a.plaid_account_id, a.id]));
      const allChanged = [...added, ...modified];

      // Raw plaid_transactions upsert
      const rawRows = allChanged
        .filter((tx) => accountMap[tx.account_id])
        .map((tx) => mapPlaidTransaction(tx, accountMap[tx.account_id], item.user_id));

      if (rawRows.length > 0) {
        await supabaseAdmin.from('plaid_transactions').upsert(rawRows, { onConflict: 'plaid_transaction_id' });
      }

      // Expenses upsert
      const { toUpsert: expenseRows } = filterAndMapExpenses(allChanged, accountMap, item.user_id);
      if (expenseRows.length > 0) {
        await supabaseAdmin.from('expenses').upsert(expenseRows, { onConflict: 'plaid_transaction_id' });
        results.expenses_imported += expenseRows.length;
      }

      // Remove deleted
      if (removed.length > 0) {
        const removedIds = removed.map((r) => r.transaction_id);
        await Promise.all([
          supabaseAdmin.from('plaid_transactions').delete().in('plaid_transaction_id', removedIds).eq('user_id', item.user_id),
          supabaseAdmin.from('expenses').delete().in('plaid_transaction_id', removedIds).eq('user_id', item.user_id),
        ]);
      }

      // Save cursor + refresh balances
      await supabaseAdmin
        .from('plaid_items')
        .update({ cursor, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      const balanceRes = await plaidClient.accountsGet({ access_token: item.access_token });
      for (const acct of balanceRes.data.accounts) {
        if (accountMap[acct.account_id]) {
          await supabaseAdmin.from('plaid_accounts').update({
            current_balance: acct.balances.current,
            available_balance: acct.balances.available,
            last_synced_at: new Date().toISOString(),
          }).eq('plaid_account_id', acct.account_id);
        }
      }

      results.synced++;
      results.added += added.length;
      results.modified += modified.length;
      results.removed += removed.length;
    } catch (err) {
      console.error(`[admin-sync] Error on item ${item.plaid_item_id}:`, err);
      const errorCode = err.response?.data?.error_code;
      await supabaseAdmin.from('plaid_items').update({ status: 'error', error_code: errorCode }).eq('id', item.id);
      results.errors++;
    }
  }

  console.log('[admin-sync] Complete:', results);
  return NextResponse.json({ success: true, ...results });
}
