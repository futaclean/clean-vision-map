-- Create storage bucket for waste report images
INSERT INTO storage.buckets (id, name, public)
VALUES ('waste-reports', 'waste-reports', true);

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload waste report images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'waste-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view images
CREATE POLICY "Public can view waste report images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'waste-reports');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own waste report images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'waste-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);