ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS disable_mode text NOT NULL DEFAULT 'hide',
  ADD COLUMN IF NOT EXISTS min_plan text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS min_role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS disabled_message text,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

ALTER TABLE public.feature_flags
  DROP CONSTRAINT IF EXISTS feature_flags_disable_mode_check;
ALTER TABLE public.feature_flags
  ADD CONSTRAINT feature_flags_disable_mode_check
  CHECK (disable_mode IN ('hide', 'coming_soon', 'pro_only'));

ALTER TABLE public.feature_flags
  DROP CONSTRAINT IF EXISTS feature_flags_min_plan_check;
ALTER TABLE public.feature_flags
  ADD CONSTRAINT feature_flags_min_plan_check
  CHECK (min_plan IN ('none', 'trial', 'pro'));

ALTER TABLE public.feature_flags
  DROP CONSTRAINT IF EXISTS feature_flags_min_role_check;
ALTER TABLE public.feature_flags
  ADD CONSTRAINT feature_flags_min_role_check
  CHECK (min_role IN ('user', 'moderator', 'admin'));

-- Allow authenticated users to auto-register a missing flag with safe defaults.
-- Admins can still update everything via existing policies.
DROP POLICY IF EXISTS "feature_flags_auth_autoregister" ON public.feature_flags;
CREATE POLICY "feature_flags_auth_autoregister"
  ON public.feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert new admin-controllable feature rows
INSERT INTO public.feature_flags (feature_key, enabled, label, description, category) VALUES
  ('feedback_form', true, 'ফিডব্যাক ফর্ম', 'ব্যবহারকারীরা ফিডব্যাক পাঠাতে পারবেন', 'engagement'),
  ('support_chat', true, 'সাপোর্ট চ্যাট', 'সাপোর্ট মেসেজ/টিকেট সিস্টেম', 'engagement'),
  ('user_notifications', true, 'ইউজার নোটিফিকেশন', 'বেল আইকন ও নোটিফিকেশন পেইজ', 'engagement'),
  ('google_signup', true, 'Google সাইন-আপ', 'Google দিয়ে রেজিস্টার/লগইন বাটন', 'auth'),
  ('user_registration', true, 'নতুন রেজিস্ট্রেশন', 'নতুন ইউজার রেজিস্টার করতে পারবেন', 'auth'),
  ('community_forum', false, 'কমিউনিটি ফোরাম', 'ইউজাররা পোস্ট/কমেন্ট করতে পারবেন (পরীক্ষামূলক)', 'engagement')
ON CONFLICT (feature_key) DO NOTHING;

-- Trigger to log feature flag changes
CREATE OR REPLACE FUNCTION public.log_feature_flag_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE' AND (
    OLD.enabled IS DISTINCT FROM NEW.enabled OR
    OLD.disable_mode IS DISTINCT FROM NEW.disable_mode OR
    OLD.min_plan IS DISTINCT FROM NEW.min_plan OR
    OLD.min_role IS DISTINCT FROM NEW.min_role OR
    OLD.disabled_message IS DISTINCT FROM NEW.disabled_message
  ) THEN
    PERFORM public.log_admin_action(
      'feature_flag_updated',
      'feature_flag',
      NEW.feature_key,
      NULL,
      jsonb_build_object(
        'before', jsonb_build_object('enabled', OLD.enabled, 'disable_mode', OLD.disable_mode, 'min_plan', OLD.min_plan, 'min_role', OLD.min_role),
        'after',  jsonb_build_object('enabled', NEW.enabled, 'disable_mode', NEW.disable_mode, 'min_plan', NEW.min_plan, 'min_role', NEW.min_role)
      )
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_admin_action(
      'feature_flag_created',
      'feature_flag',
      NEW.feature_key,
      NULL,
      jsonb_build_object('label', NEW.label, 'enabled', NEW.enabled)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_admin_action(
      'feature_flag_deleted',
      'feature_flag',
      OLD.feature_key,
      NULL,
      jsonb_build_object('label', OLD.label)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_log_feature_flag_change ON public.feature_flags;
CREATE TRIGGER trg_log_feature_flag_change
  AFTER INSERT OR UPDATE OR DELETE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.log_feature_flag_change();