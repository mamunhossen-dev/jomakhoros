-- 1. Add new columns to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

-- 2. Update SELECT policy for active notifications to respect expiry/start
DROP POLICY IF EXISTS "Anyone authenticated can view active notifications" ON public.notifications;
CREATE POLICY "Anyone authenticated can view active notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (expires_at IS NULL OR expires_at > now())
);

-- 3. Notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'normal',
  link text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view templates"
ON public.notification_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage templates insert"
ON public.notification_templates FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage templates update"
ON public.notification_templates FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage templates delete"
ON public.notification_templates FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_notif_templates_updated
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();