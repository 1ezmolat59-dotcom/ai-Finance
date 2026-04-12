import { NextResponse } from 'next/server';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/plaid/balances
 * Returns all linked accounts with their latest balances from the DB.
 * For a real-time refresh, call /api/plaid/sync-transactions first.
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: accounts, error } = await supabase
      .from('plaid_accounts')
      .select(`
        id,
        name,
        official_name,
        type,
        subtype,
        mask,
        current_balance,
        available_balance,
        iso_currency_code,
        last_synced_at,
        plaid_items (
          institution_name,
          status,
          error_code
        )
      `)
      .eq('user_id', user.id)
      .order('type');

    if (error) throw error;

    // Compute totals by type
    const summary = accounts.reduce(
      (acc, account) => {
        const balance = account.current_balance || 0;
        if (account.type === 'depository') acc.total_cash += balance;
        if (account.type === 'credit') acc.total_credit_used += balance;
        return acc;
      },
      { total_cash: 0, total_credit_used: 0 }
    );

    return NextResponse.json({ accounts, summary });
  } catch (error) {
    console.error('Plaid balances error:', error);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}
