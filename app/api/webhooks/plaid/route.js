import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key'
  );
}

/**
 * POST /api/webhooks/plaid
 * Handles real-time Plaid webhook events.
 * Register this URL in Plaid Dashboard → Webhooks.
 *
 * Key events handled:
 *  - SYNC_UPDATES_AVAILABLE  → new transactions ready to sync
 *  - DEFAULT_UPDATE          → legacy transactions update (fallback)
 *  - ITEM_ERROR              → access revoked or item needs re-auth
 */
export async function POST(request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await request.json();
    const { webhook_type, webhook_code, item_id, error } = body;

    console.log(`[Plaid Webhook] ${webhook_type}/${webhook_code} for item: ${item_id}`);

    // Look up the item in our DB
    const { data: item } = await supabaseAdmin
      .from('plaid_items')
      .select('*')
      .eq('plaid_item_id', item_id)
      .single();

    if (!item) {
      // Unknown item — acknowledge but do nothing
      return NextResponse.json({ received: true });
    }

    if (webhook_type === 'TRANSACTIONS') {
      if (webhook_code === 'SYNC_UPDATES_AVAILABLE' || webhook_code === 'DEFAULT_UPDATE') {
        // Trigger a server-side sync for this item's user
        // In production, consider queuing this with a job queue (e.g. Inngest, Trigger.dev)
        await triggerSyncForUser(item.user_id);
      }

      if (webhook_code === 'TRANSACTIONS_REMOVED') {
        const removedIds = body.removed_transactions || [];
        if (removedIds.length > 0) {
          await supabaseAdmin
            .from('plaid_transactions')
            .delete()
            .in('plaid_transaction_id', removedIds)
            .eq('user_id', item.user_id);
        }
      }
    }

    if (webhook_type === 'ITEM') {
      if (webhook_code === 'ERROR' || webhook_code === 'PENDING_EXPIRATION') {
        // Mark item as errored — user needs to re-authenticate via Plaid Link update mode
        await supabaseAdmin
          .from('plaid_items')
          .update({
            status: 'error',
            error_code: error?.error_code || webhook_code,
          })
          .eq('id', item.id);
      }

      if (webhook_code === 'USER_PERMISSION_REVOKED' || webhook_code === 'ACCESS_CONSENT_EXPIRATION') {
        await supabaseAdmin
          .from('plaid_items')
          .update({ status: 'disconnected' })
          .eq('id', item.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Plaid Webhook] Error:', err);
    // Always return 200 to Plaid — otherwise it will retry
    return NextResponse.json({ received: true, error: err.message });
  }
}

/**
 * Calls the sync endpoint internally for a given user.
 * In production, replace with a background job to avoid webhook timeout.
 */
async function triggerSyncForUser(userId) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return;

  try {
    await fetch(`${appUrl}/api/plaid/sync-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass user ID via a secret header for internal calls
        'x-internal-user-id': userId,
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
    });
  } catch (e) {
    console.error('Failed to trigger sync:', e);
  }
}
