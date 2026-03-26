CREATE TABLE IF NOT EXISTS public.profiles (
  client_id text PRIMARY KEY,
  is_pro boolean DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
