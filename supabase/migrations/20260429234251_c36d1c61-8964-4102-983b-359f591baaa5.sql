
CREATE TABLE public.admin_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_user_id UUID,
  related_entity_type TEXT,
  related_entity_id TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_requests_status ON public.admin_requests(status);
CREATE INDEX idx_admin_requests_requester ON public.admin_requests(requester_id);
CREATE INDEX idx_admin_requests_created ON public.admin_requests(created_at DESC);

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Moderators and admins can create requests
CREATE POLICY "Mods and admins create requests"
ON public.admin_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requester_id
  AND (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Requesters can view their own; admins see all
CREATE POLICY "View own or admin sees all"
ON public.admin_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can update (resolve/reject)
CREATE POLICY "Admins update requests"
ON public.admin_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Requesters can cancel their own pending requests; admins can delete any
CREATE POLICY "Delete own pending or admin"
ON public.admin_requests
FOR DELETE
TO authenticated
USING (
  (auth.uid() = requester_id AND status = 'pending')
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- updated_at trigger
CREATE TRIGGER update_admin_requests_updated_at
BEFORE UPDATE ON public.admin_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger: notify all admins on new request, notify requester on status change
CREATE OR REPLACE FUNCTION public.notify_admin_request_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_requester_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(user_name, email, 'একজন মডারেটর') INTO v_requester_name
    FROM public.user_roles WHERE user_id = NEW.requester_id LIMIT 1;

    FOR v_admin IN
      SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
    LOOP
      INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
      VALUES (
        v_admin.user_id,
        'admin_request_new',
        '🛎️ নতুন এডমিন রিকোয়েস্ট',
        v_requester_name || ' একটি রিকোয়েস্ট পাঠিয়েছেন: ' || NEW.title,
        '/admin?tab=admin-requests',
        jsonb_build_object('request_id', NEW.id, 'request_type', NEW.request_type, 'priority', NEW.priority)
      );
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
    VALUES (
      NEW.requester_id,
      'admin_request_update',
      CASE NEW.status
        WHEN 'approved' THEN '✅ রিকোয়েস্ট অনুমোদিত'
        WHEN 'rejected' THEN '❌ রিকোয়েস্ট প্রত্যাখ্যাত'
        WHEN 'completed' THEN '🎉 রিকোয়েস্ট সম্পন্ন'
        WHEN 'in_progress' THEN '⏳ রিকোয়েস্ট প্রক্রিয়াধীন'
        ELSE 'রিকোয়েস্ট আপডেট'
      END,
      'আপনার রিকোয়েস্ট "' || NEW.title || '" এর স্ট্যাটাস: ' || NEW.status ||
        COALESCE(E'\nএডমিনের মন্তব্য: ' || NEW.admin_response, ''),
      '/admin?tab=admin-requests',
      jsonb_build_object('request_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_request_change
AFTER INSERT OR UPDATE ON public.admin_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_request_change();
