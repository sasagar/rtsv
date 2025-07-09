CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Temporarily disable row security for the insert into profiles
  PERFORM set_config('row_security.active', 'off', true);

  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);

  -- Re-enable row security
  PERFORM set_config('row_security.active', 'on', true);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
