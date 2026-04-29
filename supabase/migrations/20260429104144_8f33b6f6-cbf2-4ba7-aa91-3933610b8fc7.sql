-- Per-user notifications for payment events, reminders etc.
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  meta JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_notifications_user_created ON public.user_notifications(user_id, created_at DESC);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications(user_id) WHERE is_read = false;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users update own notifications"
  ON public.user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.user_notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated insert own; admins any"
  ON public.user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Trigger: notify user when their payment_request is created or status changes
CREATE OR REPLACE FUNCTION public.notify_payment_request_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
    VALUES (
      NEW.user_id,
      'payment_submitted',
      'পেমেন্ট জমা হয়েছে',
      'আপনার ' || NEW.plan || ' প্ল্যানের পেমেন্ট রিকোয়েস্ট জমা হয়েছে। অ্যাডমিন যাচাই করে অনুমোদন করবেন।',
      '/subscription',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'plan', NEW.plan)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
      VALUES (
        NEW.user_id,
        'payment_approved',
        '🎉 পেমেন্ট অনুমোদিত!',
        'অভিনন্দন! আপনার ' || NEW.plan || ' প্ল্যান সক্রিয় হয়েছে। রসিদ ডাউনলোড করতে সাবস্ক্রিপশন পেইজে যান।',
        '/subscription',
        jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'plan', NEW.plan)
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.user_notifications (user_id, type, title, body, link, meta)
      VALUES (
        NEW.user_id,
        'payment_rejected',
        'পেমেন্ট প্রত্যাখ্যাত',
        COALESCE('কারণ: ' || NEW.admin_note, 'আপনার ' || NEW.plan || ' প্ল্যানের পেমেন্ট প্রত্যাখ্যাত হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।'),
        '/subscription',
        jsonb_build_object('payment_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_request_notify ON public.payment_requests;
CREATE TRIGGER trg_payment_request_notify
AFTER INSERT OR UPDATE ON public.payment_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_payment_request_change();