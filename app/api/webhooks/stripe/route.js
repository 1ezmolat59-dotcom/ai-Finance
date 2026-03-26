import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return NextResponse.json({ error: "No webhook secret configured in .env.local" }, { status: 400 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook Error: " + err.message }, { status: 400 });
  }

  switch (event.type) {
    // Initial checkout completed — upgrade to Pro
    case "checkout.session.completed": {
      const session = event.data.object;
      const clientId = session.client_reference_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (clientId) {
        const { error } = await supabase
          .from("profiles")
          .upsert({
            client_id: clientId,
            is_pro: true,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          }, { onConflict: "client_id" });

        if (error) {
          console.error("Error upgrading profile to PRO:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
        console.log(`Upgraded user ${clientId} to PRO`);
      }
      break;
    }

    // Subscription renewed or payment succeeded
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const { error } = await supabase
          .from("profiles")
          .update({ is_pro: true })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Error confirming renewal:", error);
        } else {
          console.log(`Renewal confirmed for subscription ${subscriptionId}`);
        }
      }
      break;
    }

    // Payment failed — could downgrade or notify
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        console.warn(`Payment failed for subscription ${subscriptionId}. Stripe will retry.`);
      }
      break;
    }

    // Subscription cancelled — downgrade to Free
    case "customer.subscription.deleted": {
      const subscription = event.data.object;

      const { error } = await supabase
        .from("profiles")
        .update({ is_pro: false })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Error downgrading profile:", error);
      } else {
        console.log(`Downgraded subscription ${subscription.id} to FREE`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
