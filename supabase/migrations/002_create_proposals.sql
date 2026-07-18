CREATE TABLE public.proposals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by       TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL DEFAULT 'Untitled Proposal',
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','sent','viewed','signed','paid','declined')),
  sections         JSONB NOT NULL DEFAULT '[]',
  customer_name    TEXT,
  customer_email   TEXT,
  public_token     TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  valid_until      TIMESTAMPTZ,
  total_amount     NUMERIC(12,2),
  currency         TEXT DEFAULT 'usd',
  requires_payment BOOLEAN DEFAULT FALSE,
  sent_at          TIMESTAMPTZ,
  viewed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_created_by ON public.proposals(created_by);
CREATE INDEX idx_proposals_public_token ON public.proposals(public_token);

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
