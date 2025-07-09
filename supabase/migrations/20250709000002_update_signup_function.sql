DROP FUNCTION IF EXISTS public.signup_with_invite(p_email TEXT, p_password TEXT, p_invite_code TEXT);

CREATE OR REPLACE FUNCTION public.validate_and_use_invite_code(p_invite_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- 招待コードを検証
  SELECT * INTO invite_record
  FROM public.invite_codes
  WHERE code = p_invite_code AND expires_at > NOW() AND uses < max_uses;

  IF invite_record.id IS NULL THEN
    RETURN FALSE; -- 無効または期限切れの招待コード
  END IF;

  -- 招待コードの使用回数をインクリメント
  UPDATE public.invite_codes
  SET uses = uses + 1
  WHERE id = invite_record.id;

  RETURN TRUE; -- 招待コードが有効で、使用回数が更新された
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
