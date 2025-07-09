-- 1. Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_with_invite ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_with_invite();

-- 2. Create the new function to handle user creation with invite code and role
CREATE OR REPLACE FUNCTION public.handle_new_user_with_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_id INT;
  invite_code_text TEXT;
BEGIN
  -- Extract invite code from the user's metadata
  invite_code_text := new.raw_user_meta_data->>'invite_code';

  -- Check if an invite code was provided
  IF invite_code_text IS NULL THEN
    RAISE EXCEPTION 'An invite code is required to sign up.';
  END IF;

  -- Validate the invite code and lock the row for update
  SELECT id INTO invite_id
  FROM public.invite_codes
  WHERE code = invite_code_text AND expires_at > NOW() AND uses < max_uses
  FOR UPDATE; -- Lock the row to prevent race conditions

  IF invite_id IS NULL THEN
    -- If the invite code is invalid, the entire transaction will be rolled back,
    -- preventing the user from being created.
    RAISE EXCEPTION 'Invalid or expired invite code.';
  END IF;

  -- If the code is valid, proceed to insert the profile with default 'user' role
  INSERT INTO public.profiles (id, email, role) -- role カラムを追加
  VALUES (new.id, new.email, 'user'); -- デフォルトで 'user' ロールを設定

  -- Increment the usage count of the invite code
  UPDATE public.invite_codes
  SET uses = uses + 1
  WHERE id = invite_id;

  RETURN new;
END;
$$;

-- 3. Create the new trigger on the auth.users table
CREATE TRIGGER on_auth_user_created_with_invite
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_invite();
