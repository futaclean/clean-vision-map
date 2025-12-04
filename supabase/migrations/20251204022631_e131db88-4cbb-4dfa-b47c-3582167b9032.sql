-- Create landmark suggestions table
CREATE TABLE public.landmark_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landmark_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can create suggestions
CREATE POLICY "Users can create landmark suggestions"
ON public.landmark_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions"
ON public.landmark_suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.landmark_suggestions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update suggestions
CREATE POLICY "Admins can update suggestions"
ON public.landmark_suggestions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
ON public.landmark_suggestions
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_landmark_suggestions_updated_at
BEFORE UPDATE ON public.landmark_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();