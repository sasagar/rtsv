-- Function to update user's custom claims based on their profile role
CREATE OR REPLACE FUNCTION public.update_user_claims_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This function needs to be SECURITY DEFINER to update auth.users
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Update the user's app_metadata in auth.users
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{claims,role}',
      to_jsonb(NEW.role),
      true
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to call the function when a profile's role changes
CREATE TRIGGER on_profile_role_change
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_claims_from_profile();

-- Function to set initial user claims on new profile creation
CREATE OR REPLACE FUNCTION public.set_initial_user_claims_on_profile_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update the user's app_metadata in auth.users with the initial role
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{claims,role}',
    to_jsonb(NEW.role),
    true
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger to call the function when a new profile is created
CREATE TRIGGER on_profile_create_set_claims
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_initial_user_claims_on_profile_create();

-- Backfill existing users' claims
DO $$
DECLARE
  user_record record;
BEGIN
  FOR user_record IN SELECT id, role FROM public.profiles LOOP
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{claims,role}',
      to_jsonb(user_record.role),
      true
    )
    WHERE id = user_record.id;
  END LOOP;
END;
$$;
