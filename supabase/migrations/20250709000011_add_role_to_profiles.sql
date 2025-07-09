-- Add role column to public.profiles table
ALTER TABLE public.profiles
ADD COLUMN role text DEFAULT 'user' NOT NULL;

-- Update existing profiles to have 'user' role
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;
