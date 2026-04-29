
-- Fix RLS: ensure WITH CHECK is set for updates
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user to seed default notifications for new users
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
  SELECT setting_value INTO v_rules
  FROM public.app_settings
  WHERE setting_key = 'signup_rules';

  v_signup_enabled := COALESCE((v_rules->>'signup_enabled')::boolean, true);
  v_default_type   := COALESCE(v_rules->>'default_account_type', 'trial');
  v_trial_days     := COALESCE((v_rules->>'trial_days')::int, 30);
  v_pro_days       := COALESCE((v_rules->>'pro_days')::int, 30);
  v_default_role   := COALESCE((v_rules->>'default_role')::app_role, 'user'::app_role);

  IF NOT v_signup_enabled THEN
    RAISE EXCEPTION 'নতুন রেজিস্ট্রেশন বর্তমানে বন্ধ আছে। অনুগ্রহ করে পরে চেষ্টা করুন।';
  END IF;

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

  -- Seed default notifications as personal user_notifications
  INSERT INTO public.user_notifications (user_id, type, title, body)
  SELECT NEW.id, 'announcement', n.title, n.body
  FROM public.notifications n
  WHERE n.is_default = true AND n.is_active = true;

  RETURN NEW;
END;
$function$;
