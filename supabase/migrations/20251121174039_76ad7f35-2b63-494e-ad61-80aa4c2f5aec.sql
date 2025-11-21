-- Add real-time location tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_tracking_enabled BOOLEAN DEFAULT false;

-- Create index for efficient location queries
CREATE INDEX IF NOT EXISTS idx_profiles_tracking 
ON public.profiles(is_tracking_enabled, location_updated_at) 
WHERE is_tracking_enabled = true;

-- Enable realtime for profiles table to push location updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;