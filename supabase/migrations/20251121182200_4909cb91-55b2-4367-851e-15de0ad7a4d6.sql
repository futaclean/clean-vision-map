-- Fix the status check constraint to use 'resolved' instead of 'completed'
-- Drop the old constraint
ALTER TABLE public.waste_reports 
DROP CONSTRAINT IF EXISTS waste_reports_status_check;

-- Add the corrected constraint with 'resolved'
ALTER TABLE public.waste_reports
ADD CONSTRAINT waste_reports_status_check 
CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'rejected'));