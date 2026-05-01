-- 1. Add meta column to admin_requests for structured action payloads
ALTER TABLE public.admin_requests ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- 2. Trigger: notify user when admin/moderator changes their profile (plan, sub_end, block status)
CREATE OR REPLACE FUNCTION public.notify_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_title text;
  v_body text;
  v_type text;
  v_changed boolean := false;
BEGIN
  -- Only notify when an admin/moderator (not the user themselves) made the change
  IF v_actor IS NULL OR v_actor = NEW.user_id THEN
    RETURN NEW;
  END IF;
  IF NOT (public.has_role(v_actor, 'admin'::app_role) OR public.has_role(v_actor, 'moderator'::app_role)) THEN
    RETURN NEW;
  END IF;

  -- Plan / subscription changes
  IF OLD.account_type IS DISTINCT FROM NEW.account_type
     OR OLD.subscription_end IS DISTINCT FROM NEW.subscription_end THEN
    v_changed := true;
    v_type := 'plan_changed';
    IF NEW.account_type = 'pro' THEN
      IF NEW.subscription_end IS NOT NULL AND date_part('year', NEW.subscription_end) >= 2099 THEN
        v_title := '🎉 লাইফটাইম প্রো সক্রিয় হয়েছে!';
        v_body  := 'অভিনন্দন! আপনার অ্যাকাউন্টে লাইফটাইম প্রো প্ল্যান কার্যকর হয়েছে। সব ফিচার এখন উপভোগ করুন।';
      ELSE
        v_title := '🎉 প্রো প্ল্যান সক্রিয় হয়েছে!';
        v_body  := 'আপনার প্রো প্ল্যান কার্যকর হয়েছে।' ||
                   COALESCE(' মেয়াদ শেষ: ' || to_char(NEW.subscription_end AT TIME ZONE 'Asia/Dhaka', 'DD Mon YYYY'), '');
      END IF;
    ELSIF NEW.account_type = 'free' THEN
      v_title := 'প্ল্যান পরিবর্তন: ফ্রি';
      v_body  := 'আপনার অ্যাকাউন্ট এখন ফ্রি প্ল্যানে। প্রো ফিচার ব্যবহার করতে আপগ্রেড করুন।';
    ELSIF NEW.account_type = 'trial' THEN
      v_title := 'ট্রায়াল প্ল্যান চালু হয়েছে';
      v_body  := 'আপনার অ্যাকাউন্টে ট্রায়াল প্ল্যান সক্রিয় করা হয়েছে।' ||
                 COALESCE(' মেয়াদ শেষ: ' || to_char(NEW.trial_end_date AT TIME ZONE 'Asia/Dhaka', 'DD Mon YYYY'), '');
    ELSE
      v_title := 'প্ল্যান আপডেট হয়েছে';
      v_body  := 'আপনার অ্যাকাউন্ট প্ল্যান পরিবর্তন করা হয়েছে।';
    END IF;

    INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
    VALUES (NEW.user_id, v_type, v_title, v_body, '/subscription',
            jsonb_build_object('account_type', NEW.account_type, 'subscription_end', NEW.subscription_end));
  END IF;

  -- Block / unblock changes (separate notification)
  IF OLD.is_blocked IS DISTINCT FROM NEW.is_blocked THEN
    IF NEW.is_blocked = true THEN
      INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
      VALUES (NEW.user_id, 'account_blocked', '🚫 অ্যাকাউন্ট ব্লক হয়েছে',
              COALESCE('কারণ: ' || NEW.block_reason, 'আপনার অ্যাকাউন্ট সাময়িকভাবে ব্লক করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।'),
              '/feedback', jsonb_build_object('reason', NEW.block_reason));
    ELSE
      INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
      VALUES (NEW.user_id, 'account_unblocked', '✅ অ্যাকাউন্ট আনব্লক হয়েছে',
              'আপনার অ্যাকাউন্টের ব্লক তুলে নেওয়া হয়েছে। আপনি আবার সব ফিচার ব্যবহার করতে পারবেন।',
              '/', '{}'::jsonb);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_profile_change ON public.profiles;
CREATE TRIGGER trg_notify_profile_change
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_profile_change();

-- 3. Trigger: notify user when role is changed by admin
CREATE OR REPLACE FUNCTION public.notify_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_role_label text;
BEGIN
  IF v_actor IS NULL OR v_actor = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_role_label := CASE NEW.role::text
    WHEN 'admin' THEN 'অ্যাডমিন'
    WHEN 'moderator' THEN 'মডারেটর'
    ELSE 'ইউজার'
  END;

  INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
  VALUES (NEW.user_id, 'role_changed', '👑 আপনার রোল পরিবর্তন হয়েছে',
          'অ্যাডমিন আপনাকে নতুন রোল দিয়েছেন: ' || v_role_label || '। পেইজ রিফ্রেশ করলে নতুন অপশনগুলো দেখতে পাবেন।',
          '/', jsonb_build_object('new_role', NEW.role));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_role_change ON public.user_roles;
CREATE TRIGGER trg_notify_role_change
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.notify_role_change();

-- 4. When an admin_request of type 'manual_pro_grant' is approved by admin,
-- automatically apply the Pro plan to the target user.
CREATE OR REPLACE FUNCTION public.apply_admin_request_on_approve()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target uuid;
  v_months int;
  v_lifetime boolean;
  v_sub_end timestamptz;
BEGIN
  -- Only on transition to 'approved'
  IF NEW.status <> 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  -- Only handle manual pro grants
  IF NEW.request_type <> 'manual_pro_grant' THEN
    RETURN NEW;
  END IF;

  v_target   := NULLIF(NEW.meta->>'target_user_id','')::uuid;
  v_months   := COALESCE((NEW.meta->>'months')::int, 1);
  v_lifetime := COALESCE((NEW.meta->>'lifetime')::boolean, false);

  IF v_target IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_lifetime THEN
    v_sub_end := '2099-12-31T23:59:59Z'::timestamptz;
  ELSE
    -- Extend from current sub_end if still in future, else from now
    SELECT GREATEST(now(), COALESCE(subscription_end, now())) + make_interval(months => v_months)
      INTO v_sub_end
      FROM public.profiles WHERE user_id = v_target;
  END IF;

  UPDATE public.profiles
     SET account_type       = 'pro',
         subscription_start = COALESCE(subscription_start, now()),
         subscription_end   = v_sub_end,
         payment_status     = 'paid'
   WHERE user_id = v_target;

  -- Mark completed
  NEW.status := 'completed';
  NEW.resolved_at := COALESCE(NEW.resolved_at, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_admin_request_on_approve ON public.admin_requests;
CREATE TRIGGER trg_apply_admin_request_on_approve
BEFORE UPDATE ON public.admin_requests
FOR EACH ROW
EXECUTE FUNCTION public.apply_admin_request_on_approve();