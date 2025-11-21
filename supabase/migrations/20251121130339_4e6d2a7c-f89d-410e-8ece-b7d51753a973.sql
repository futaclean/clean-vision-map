-- Add rejection_reason column to waste_reports table
ALTER TABLE public.waste_reports 
ADD COLUMN rejection_reason text;