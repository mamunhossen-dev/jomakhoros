-- Update handle_new_user to read signup rules from app_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rules jsonb;
  v_signup_enabled boolean;
  v_default_type text;
  v_trial_days int;
  v_pro_days int;
  v_default_role app_role;
  v_account_type text;
  v_trial_start timestamptz;
  v_trial_end timestamptz;
  v_sub_start timestamptz;
  v_sub_end timestamptz;
BEGIN
  -- Read signup rules
  SELECT setting_value INTO v_rules
  FROM public.app_settings
  WHERE setting_key = 'signup_rules';

  v_signup_enabled := COALESCE((v_rules->>'signup_enabled')::boolean, true);
  v_default_type   := COALESCE(v_rules->>'default_account_type', 'trial');
  v_trial_days     := COALESCE((v_rules->>'trial_days')::int, 30);
  v_pro_days       := COALESCE((v_rules->>'pro_days')::int, 30);
  v_default_role   := COALESCE((v_rules->>'default_role')::app_role, 'user'::app_role);

  -- Block signup if disabled
  IF NOT v_signup_enabled THEN
    RAISE EXCEPTION 'নতুন রেজিস্ট্রেশন বর্তমানে বন্ধ আছে। অনুগ্রহ করে পরে চেষ্টা করুন।';
  END IF;

  -- Calculate dates based on default account type
  v_trial_start := NULL; v_trial_end := NULL;
  v_sub_start := NULL; v_sub_end := NULL;
  v_account_type := v_default_type;

  IF v_default_type = 'trial' THEN
    v_trial_start := now();
    v_trial_end   := now() + make_interval(days => v_trial_days);
  ELSIF v_default_type = 'pro' THEN
    v_sub_start := now();
    v_sub_end   := now() + make_interval(days => v_pro_days);
  END IF;
  -- 'free' → all dates null

  INSERT INTO public.profiles (
    user_id, display_name, account_type,
    trial_start_date, trial_end_date,
    subscription_start, subscription_end
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    v_account_type,
    v_trial_start, v_trial_end,
    v_sub_start, v_sub_end
  );

  INSERT INTO public.user_roles (user_id, role, user_name, email)
  VALUES (
    NEW.id,
    v_default_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );

  INSERT INTO public.categories (user_id, name, type) VALUES
    (NEW.id, 'Salary', 'income'),
    (NEW.id, 'Freelance', 'income'),
    (NEW.id, 'Investments', 'income'),
    (NEW.id, 'Other Income', 'income'),
    (NEW.id, 'Food & Dining', 'expense'),
    (NEW.id, 'Transport', 'expense'),
    (NEW.id, 'Housing', 'expense'),
    (NEW.id, 'Utilities', 'expense'),
    (NEW.id, 'Entertainment', 'expense'),
    (NEW.id, 'Shopping', 'expense'),
    (NEW.id, 'Healthcare', 'expense'),
    (NEW.id, 'Other Expense', 'expense');

  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists on auth.users (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Seed default signup_rules if not present
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES (
  'signup_rules',
  jsonb_build_object(
    'signup_enabled', true,
    'default_account_type', 'trial',
    'trial_days', 30,
    'pro_days', 30,
    'default_role', 'user'
  )
)
ON CONFLICT (setting_key) DO NOTHING;