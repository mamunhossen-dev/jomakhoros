
-- 1. Add user_name and email columns to user_roles (at beginning is not possible in postgres, but we add them)
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill from auth.users + profiles for existing rows
UPDATE public.user_roles ur
SET email = au.email,
    user_name = COALESCE(p.display_name, au.raw_user_meta_data->>'full_name')
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE ur.user_id = au.id AND (ur.email IS NULL OR ur.user_name IS NULL);

-- 2. Notifications table (admin-broadcast notifications visible to all users)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track which notifications a user has read
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reads" ON public.notification_reads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reads" ON public.notification_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reads" ON public.notification_reads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Support messages (between user and admin/support)
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- the user the conversation belongs to
  sender_id uuid NOT NULL, -- who sent it (user or admin)
  is_from_admin boolean NOT NULL DEFAULT false,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversation"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Users send messages in own conversation"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid() = user_id 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'moderator'::app_role)
    )
  );

CREATE POLICY "Users mark read in own conversation"
  ON public.support_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins delete messages"
  ON public.support_messages FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id, created_at);

-- 4. Seed default welcome notification
INSERT INTO public.notifications (title, body, is_default, is_active)
SELECT 
  'JomaKhoros-এ স্বাগতম',
  E'টাকা ইনকাম করা কঠিন, কিন্তু টাকার হিসাব রাখা তার থেকেও কঠিন।\nঅনেক সময় আমরা বুঝতেই পারি না টাকা কোথায় চলে যায়।\n\nJomaKhoros আপনার টাকার হিসাব রাখার একজন নীরব সহকারী।\n\n\n\nআজ থেকেই প্রতিদিনের খরচ লিখে রাখুন, মাস শেষে নিজেই অবাক হয়ে যাবেন।\n\n\n\n\nআপনার আর্থিক জীবনের একটি ছোট পরিবর্তন, ভবিষ্যতে বড় নিরাপত্তা দিতে পারে।\n\n— JomaKhoros.com',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE is_default = true);

-- 5. Update handle_new_user to also populate user_roles user_name + email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, account_type, trial_start_date, trial_end_date)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'trial',
    now(),
    now() + INTERVAL '1 month'
  );

  INSERT INTO public.user_roles (user_id, role, user_name, email) 
  VALUES (
    NEW.id, 
    'user',
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

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
