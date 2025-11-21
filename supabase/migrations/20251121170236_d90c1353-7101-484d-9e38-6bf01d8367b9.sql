-- Add location fields to profiles table for cleaner locations
ALTER TABLE public.profiles 
ADD COLUMN location_lat NUMERIC,
ADD COLUMN location_lng NUMERIC,
ADD COLUMN location_address TEXT;