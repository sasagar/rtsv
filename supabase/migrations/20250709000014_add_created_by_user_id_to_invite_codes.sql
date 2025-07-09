-- Add created_by_user_id to invite_codes table
ALTER TABLE public.invite_codes
ADD COLUMN created_by_user_id uuid REFERENCES auth.users(id);
