-- Add availability status to profiles table
DO $$ BEGIN
  CREATE TYPE public.cleaner_availability AS ENUM ('available', 'busy', 'off_duty');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS availability_status public.cleaner_availability DEFAULT 'available';

-- Create index for efficient availability queries
CREATE INDEX IF NOT EXISTS idx_profiles_availability 
ON public.profiles(availability_status) 
WHERE availability_status IS NOT NULL;

-- Add timestamp for tracking status changes
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS availability_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to update availability timestamp
CREATE OR REPLACE FUNCTION public.update_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.availability_status IS DISTINCT FROM OLD.availability_status THEN
    NEW.availability_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for availability updates
DROP TRIGGER IF EXISTS trigger_update_availability_timestamp ON public.profiles;
CREATE TRIGGER trigger_update_availability_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_availability_timestamp();