
-- 1. Add block fields + last_login_at to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_reason text,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 2. Allow guard trigger to permit admins to update these fields (existing guard already does this).
--    We just need to ensure non-admins cannot self-unblock.
CREATE OR REPLACE FUNCTION public.guard_profile_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.account_type       := OLD.account_type;
    NEW.payment_status     := OLD.payment_status;
    NEW.subscription_start := OLD.subscription_start;
    NEW.subscription_end   := OLD.subscription_end;
    NEW.trial_start_date   := OLD.trial_start_date;
    NEW.trial_end_date     := OLD.trial_end_date;
    NEW.is_blocked         := OLD.is_blocked;
    NEW.block_reason       := OLD.block_reason;
    NEW.blocked_at         := OLD.blocked_at;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. RPC for client to record its own last_login_at without touching guarded fields
CREATE OR REPLACE FUNCTION public.touch_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
     SET last_login_at = now()
   WHERE user_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_last_login() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.touch_last_login() TO authenticated;

-- 4. RPC for admin to set/clear block (bypasses guard via SECURITY DEFINER + admin check)
CREATE OR REPLACE FUNCTION public.admin_set_user_block(_user_id uuid, _blocked boolean, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'শুধুমাত্র অ্যাডমিন এই কাজ করতে পারবেন';
  END IF;
  UPDATE public.profiles
     SET is_blocked   = _blocked,
         block_reason = CASE WHEN _blocked THEN _reason ELSE NULL END,
         blocked_at   = CASE WHEN _blocked THEN now() ELSE NULL END
   WHERE user_id = _user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_block(uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_block(uuid, boolean, text) TO authenticated;
