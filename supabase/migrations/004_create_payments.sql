CREATE TABLE public.payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id              UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  stripe_session_id        TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount                   INTEGER NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'usd',
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','completed','failed','refunded')),
  customer_email           TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  completed_at             TIMESTAMPTZ
);

CREATE INDEX idx_payments_proposal_id ON public.payments(proposal_id);
