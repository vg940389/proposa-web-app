-- Auto-update proposal status when a signature is inserted
CREATE OR REPLACE FUNCTION public.handle_new_signature()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the proposal status to 'signed' if it's currently 'sent' or 'viewed' or 'draft'
  UPDATE public.proposals
  SET 
    status = 'signed',
    updated_at = NOW()
  WHERE id = NEW.proposal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_signature_created
  AFTER INSERT ON public.signatures
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_signature();
