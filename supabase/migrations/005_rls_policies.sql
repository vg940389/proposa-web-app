-- Profiles: users can only access their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id);

-- Proposals: owners have full access; anon can read by public_token
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_owner_all" ON public.proposals
  FOR ALL USING (auth.uid()::text = created_by);

CREATE POLICY "proposals_public_select" ON public.proposals
  FOR SELECT USING (public_token IS NOT NULL);

-- Signatures: owners can read; anyone can insert (guarded by valid token at app level)
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signatures_owner_read" ON public.signatures
  FOR SELECT USING (
    proposal_id IN (SELECT id FROM public.proposals WHERE created_by = auth.uid()::text)
  );

CREATE POLICY "signatures_public_insert" ON public.signatures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "signatures_public_select" ON public.signatures
  FOR SELECT USING (true);

-- Payments: owners can read; service role handles writes via Edge Functions
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_owner_read" ON public.payments
  FOR SELECT USING (
    proposal_id IN (SELECT id FROM public.proposals WHERE created_by = auth.uid()::text)
  );
