-- Audit log table for tracking admin/moderator actions
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL,
  actor_email TEXT,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  target_user_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON public.admin_audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_target ON public.admin_audit_logs(target_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.admin_audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users (admins/mods) can insert their own actions
CREATE POLICY "Admins/mods can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'moderator'::app_role)
    )
  );

-- No update/delete - logs are immutable

-- Helper function to log admin actions easily
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action TEXT,
  _entity_type TEXT,
  _entity_id TEXT DEFAULT NULL,
  _target_user_id UUID DEFAULT NULL,
  _details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_email TEXT;
  v_name TEXT;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)) THEN
    RETURN NULL;
  END IF;

  SELECT email, user_name INTO v_email, v_name
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  INSERT INTO public.admin_audit_logs (
    actor_id, actor_email, actor_name, action, entity_type, entity_id, target_user_id, details
  ) VALUES (
    auth.uid(), v_email, v_name, _action, _entity_type, _entity_id, _target_user_id, _details
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;