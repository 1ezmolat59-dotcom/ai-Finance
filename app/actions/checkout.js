"use server";

import Stripe from "stripe";
import { headers } from "next/headers";

const ALLOWED_PRICE_IDS = new Set([
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
]);

export async function createCheckoutSession(priceId, clientId) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is missing from environment variables (.env.local).");
  }

  if (!ALLOWED_PRICE_IDS.has(priceId)) {
    throw new Error("Invalid price ID.");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
      client_reference_id: clientId,
    });

    return session.url;
  } catch (error) {
    console.error("Stripe Error:", error);
    throw new Error(error.message);
  }
}

export async function getStripePriceIds() {
  return {
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  };
}
