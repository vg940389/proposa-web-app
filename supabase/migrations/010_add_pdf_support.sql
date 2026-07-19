-- Add PDF support columns to proposals table
ALTER TABLE proposals
ADD COLUMN document_type text DEFAULT 'block' CHECK (document_type IN ('block', 'pdf')),
ADD COLUMN document_url text,
ADD COLUMN pdf_fields jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for PDF documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-documents', 'proposal-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to proposal-documents
CREATE POLICY "authenticated_upload_pdf" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proposal-documents');

-- Allow authenticated users to update their own files in proposal-documents
CREATE POLICY "authenticated_update_pdf" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'proposal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files in proposal-documents
CREATE POLICY "authenticated_delete_pdf" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'proposal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to proposal-documents
CREATE POLICY "public_read_pdf" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'proposal-documents');
