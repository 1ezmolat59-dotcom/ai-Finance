"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton browser client — used for auth sign-in/out and client-side reads.
// Falls back to placeholder values at build time so the module loads without crashing.
// At runtime NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local / Vercel env vars.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
  );
}
