-- Add updated_at column to answers table
ALTER TABLE public.answers
ADD COLUMN updated_at timestamp with time zone DEFAULT now();
