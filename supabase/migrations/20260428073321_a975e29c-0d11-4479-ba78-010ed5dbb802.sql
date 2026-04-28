
-- 1. Add ticket_id to support_threads (each row = one ticket). Drop old unique on user_id.
ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS ticket_id uuid;

-- Backfill: each existing thread becomes its own ticket
UPDATE public.support_threads SET ticket_id = id WHERE ticket_id IS NULL;

ALTER TABLE public.support_threads
  ALTER COLUMN ticket_id SET NOT NULL,
  ALTER COLUMN ticket_id SET DEFAULT gen_random_uuid();

-- Drop the unique constraint on user_id if it exists (allow multiple tickets per user)
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.support_threads'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.support_threads DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

-- Unique on ticket_id
ALTER TABLE public.support_threads
  ADD CONSTRAINT support_threads_ticket_id_key UNIQUE (ticket_id);

CREATE INDEX IF NOT EXISTS idx_support_threads_user_id ON public.support_threads(user_id);

-- 2. Add ticket_id to support_messages and backfill from latest thread per user
ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS ticket_id uuid;

UPDATE public.support_messages m
SET ticket_id = t.ticket_id
FROM public.support_threads t
WHERE m.ticket_id IS NULL
  AND t.user_id = m.user_id;

-- For any leftover messages without a thread, create a thread
INSERT INTO public.support_threads (user_id, status, ticket_id)
SELECT DISTINCT m.user_id, 'new', gen_random_uuid()
FROM public.support_messages m
WHERE m.ticket_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.support_threads t WHERE t.user_id = m.user_id);

UPDATE public.support_messages m
SET ticket_id = t.ticket_id
FROM public.support_threads t
WHERE m.ticket_id IS NULL
  AND t.user_id = m.user_id;

ALTER TABLE public.support_messages
  ALTER COLUMN ticket_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);

-- 3. Replace ensure_support_thread trigger: link new message to user's active (non-closed) ticket, or create one
CREATE OR REPLACE FUNCTION public.ensure_support_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ticket uuid;
BEGIN
  IF NEW.ticket_id IS NULL THEN
    SELECT ticket_id INTO v_ticket
    FROM public.support_threads
    WHERE user_id = NEW.user_id AND status <> 'closed'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_ticket IS NULL THEN
      v_ticket := gen_random_uuid();
      INSERT INTO public.support_threads (user_id, status, ticket_id)
      VALUES (NEW.user_id, 'new', v_ticket);
    END IF;

    NEW.ticket_id := v_ticket;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_support_thread_on_message ON public.support_messages;
CREATE TRIGGER ensure_support_thread_on_message
BEFORE INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.ensure_support_thread();
