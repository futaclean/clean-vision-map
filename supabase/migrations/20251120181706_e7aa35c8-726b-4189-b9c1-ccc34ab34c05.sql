-- Add storage policies for waste-reports bucket (only missing ones)

-- Only authenticated users can upload to waste-reports bucket
CREATE POLICY "Authenticated users can upload waste reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'waste-reports');

-- Only allow image file types (jpg, jpeg, png, webp)
CREATE POLICY "Only allow image uploads to waste-reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'waste-reports' AND
  lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);