-- Add after_image_url column to waste_reports table
ALTER TABLE public.waste_reports 
ADD COLUMN after_image_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.waste_reports.after_image_url IS 'Image uploaded by cleaner after completing the work';
