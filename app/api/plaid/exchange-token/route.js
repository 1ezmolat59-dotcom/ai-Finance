import { NextResponse } from 'next/server';
import { plaidClient, mapPlaidAccount } from '@/lib/plaid';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { public_token, institution } = await request.json();

    if (!public_token) {
      return NextResponse.json({ error: 'public_token is required' }, { status: 400 });
    }

    // 1. Exchange public token for access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = tokenResponse.data;

    // 2. Store the item in DB (access_token stored — use Supabase Vault in production)
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .insert({
        user_id: user.id,
        plaid_item_id: item_id,
        access_token,
        institution_id: institution?.institution_id,
        institution_name: institution?.name,
      })
      .select()
      .single();

    if (itemError) throw itemError;

    // 3. Fetch and store accounts
    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const accounts = accountsResponse.data.accounts;

    const accountRows = accounts.map((acct) =>
      mapPlaidAccount(acct, plaidItem.id, user.id)
    );

    const { error: accountsError } = await supabase
      .from('plaid_accounts')
      .upsert(accountRows, { onConflict: 'plaid_account_id' });

    if (accountsError) throw accountsError;

    return NextResponse.json({
      success: true,
      institution_name: institution?.name,
      accounts_linked: accounts.length,
    });
  } catch (error) {
    console.error('Plaid exchange-token error:', error);
    return NextResponse.json(
      { error: error.response?.data?.error_message || 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
