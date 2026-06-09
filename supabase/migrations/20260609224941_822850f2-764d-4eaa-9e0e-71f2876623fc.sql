
DROP POLICY IF EXISTS "Cleaners can view assigned reports" ON public.waste_reports;
CREATE POLICY "Cleaners can view assigned reports"
ON public.waste_reports FOR SELECT
USING (auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Cleaners can update assigned reports" ON public.waste_reports;
CREATE POLICY "Cleaners can update assigned reports"
ON public.waste_reports FOR UPDATE
USING (auth.uid() = assigned_to)
WITH CHECK (auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Authenticated users can upload waste reports" ON storage.objects;
