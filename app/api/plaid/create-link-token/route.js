import { NextResponse } from 'next/server';
import { CountryCode, Products } from 'plaid';
import { plaidClient } from '@/lib/plaid';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'Finance-AI',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/plaid`,
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Plaid create-link-token error:', error);
    return NextResponse.json(
      { error: error.response?.data?.error_message || 'Failed to create link token' },
      { status: 500 }
    );
  }
}
