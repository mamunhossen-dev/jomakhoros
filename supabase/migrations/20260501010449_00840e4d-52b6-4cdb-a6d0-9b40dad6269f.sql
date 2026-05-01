-- 1) Storage policy cleanup
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;

-- Tighten avatar/forum upload policies to enforce per-user folder
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users upload forum images" ON storage.objects;
CREATE POLICY "Users upload forum images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'forum-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 2) recurring_transactions
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  interval_count INT NOT NULL DEFAULT 1 CHECK (interval_count >= 1),
  next_run_date DATE NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next ON public.recurring_transactions(next_run_date) WHERE is_active = true;

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own recurring" ON public.recurring_transactions
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own recurring" ON public.recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recurring" ON public.recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own recurring" ON public.recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_recurring_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Processor function
CREATE OR REPLACE FUNCTION public.process_recurring_transactions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_count INT := 0;
  v_next DATE;
BEGIN
  FOR r IN
    SELECT * FROM public.recurring_transactions
    WHERE is_active = true
      AND next_run_date <= CURRENT_DATE
      AND (end_date IS NULL OR next_run_date <= end_date)
  LOOP
    -- Insert transaction (skip if wallet missing/foreign)
    BEGIN
      INSERT INTO public.transactions (user_id, type, amount, category_id, wallet_id, description, date)
      VALUES (r.user_id, r.type, r.amount, r.category_id, r.wallet_id,
              COALESCE(r.description, '') || ' (অটো-পুনরাবৃত্তি)', r.next_run_date);
    EXCEPTION WHEN OTHERS THEN
      -- Skip this run, advance date anyway
      NULL;
    END;

    -- Compute next date
    v_next := CASE r.frequency
      WHEN 'daily'   THEN r.next_run_date + (r.interval_count || ' days')::interval
      WHEN 'weekly'  THEN r.next_run_date + (r.interval_count * 7 || ' days')::interval
      WHEN 'monthly' THEN r.next_run_date + (r.interval_count || ' months')::interval
      WHEN 'yearly'  THEN r.next_run_date + (r.interval_count || ' years')::interval
    END::date;

    UPDATE public.recurring_transactions
       SET next_run_date = v_next,
           last_run_at = now(),
           is_active = CASE WHEN end_date IS NOT NULL AND v_next > end_date THEN false ELSE true END
     WHERE id = r.id;

    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;