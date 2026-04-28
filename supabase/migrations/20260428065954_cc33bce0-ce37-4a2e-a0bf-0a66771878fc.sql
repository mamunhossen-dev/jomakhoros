-- Support thread status per user conversation
CREATE TABLE public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

-- Users can view their own thread; admins/mods can view all
CREATE POLICY "Users view own thread" ON public.support_threads
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

-- Only admins/mods can insert (also allow self-insert as fallback for new users)
CREATE POLICY "Admins or self insert thread" ON public.support_threads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

-- Only admins/mods can update status
CREATE POLICY "Admins update thread" ON public.support_threads
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "Admins delete thread" ON public.support_threads
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_support_threads_updated_at
  BEFORE UPDATE ON public.support_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create thread when a new support message arrives from a user
CREATE OR REPLACE FUNCTION public.ensure_support_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.support_threads (user_id, status)
  VALUES (NEW.user_id, 'new')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_support_thread_on_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.ensure_support_thread();

-- Backfill existing conversations
INSERT INTO public.support_threads (user_id, status)
SELECT DISTINCT user_id, 'new' FROM public.support_messages
ON CONFLICT (user_id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;