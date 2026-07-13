-- Create storage bucket for proposal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-images', 'proposal-images', true);

-- Allow authenticated users to upload files
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proposal-images');

-- Allow authenticated users to update their own files
CREATE POLICY "authenticated_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'proposal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "authenticated_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'proposal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access (for proposal previews and public viewer)
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'proposal-images');
