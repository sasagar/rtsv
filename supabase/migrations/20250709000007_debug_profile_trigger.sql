CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'handle_new_user function triggered for new user: id=%, email=%', NEW.id, NEW.email;

  -- Temporarily disable row security for the insert into profiles
  PERFORM set_config('row_security.active', 'off', true);

  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  RAISE NOTICE 'Profile inserted for user: id=%', NEW.id;

  -- Re-enable row security
  PERFORM set_config('row_security.active', 'on', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
