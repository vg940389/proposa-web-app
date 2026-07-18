-- supabase/migrations/009_payments_razorpay.sql

-- 1. Rename columns in payments table
ALTER TABLE public.payments
  RENAME COLUMN stripe_session_id TO razorpay_order_id;

ALTER TABLE public.payments
  RENAME COLUMN stripe_payment_intent_id TO razorpay_payment_id;

-- 2. Add signature column
ALTER TABLE public.payments
  ADD COLUMN razorpay_signature TEXT;

-- 3. Change currency defaults to 'inr'
ALTER TABLE public.payments
  ALTER COLUMN currency SET DEFAULT 'inr';

ALTER TABLE public.proposals
  ALTER COLUMN currency SET DEFAULT 'inr';
