CREATE TABLE public.signatures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  signer_role     TEXT NOT NULL CHECK (signer_role IN ('sender','customer')),
  signer_name     TEXT NOT NULL,
  signer_email    TEXT NOT NULL,
  signature_data  TEXT NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  signed_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signatures_proposal_id ON public.signatures(proposal_id);
