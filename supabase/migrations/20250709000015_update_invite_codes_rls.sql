-- Remove existing RLS policies on invite_codes
DROP POLICY IF EXISTS "Allow public select on invite_codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Users can insert invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Users can view invite codes" ON public.invite_codes;

-- Enable RLS on invite_codes table
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT: Only admin users can create invite codes
CREATE POLICY "Admin users can insert invite codes"
ON public.invite_codes
FOR INSERT
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Policy for SELECT: Admin users can view all invite codes,
-- regular users can view only invite codes they created
CREATE POLICY "Users can view invite codes based on role"
ON public.invite_codes
FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
  (auth.uid() = created_by_user_id)
);

-- Policy for UPDATE: Only admin users can update invite codes
CREATE POLICY "Admin users can update invite codes"
ON public.invite_codes
FOR UPDATE
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Policy for DELETE: Only admin users can delete invite codes
CREATE POLICY "Admin users can delete invite codes"
ON public.invite_codes
FOR DELETE
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
