-- 1. Add the new column (nullable first so we can backfill safely)
ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS ticket_number text;

-- 2. Function: generate a TKT-YYMMDD-NNN style number
CREATE OR REPLACE FUNCTION public.generate_support_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_part text;
  v_seq int;
  v_candidate text;
BEGIN
  v_date_part := to_char(now() AT TIME ZONE 'Asia/Dhaka', 'YYMMDD');

  -- Count existing tickets created today (in BDT) and increment
  SELECT COUNT(*) + 1
    INTO v_seq
    FROM public.support_threads
    WHERE ticket_number LIKE 'TKT-' || v_date_part || '-%';

  v_candidate := 'TKT-' || v_date_part || '-' || lpad(v_seq::text, 3, '0');

  -- In the unlikely race-condition case, keep bumping
  WHILE EXISTS (SELECT 1 FROM public.support_threads WHERE ticket_number = v_candidate) LOOP
    v_seq := v_seq + 1;
    v_candidate := 'TKT-' || v_date_part || '-' || lpad(v_seq::text, 3, '0');
  END LOOP;

  RETURN v_candidate;
END;
$$;

-- 3. Trigger: assign ticket_number on insert if not provided
CREATE OR REPLACE FUNCTION public.set_support_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_support_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_support_ticket_number ON public.support_threads;
CREATE TRIGGER trg_set_support_ticket_number
BEFORE INSERT ON public.support_threads
FOR EACH ROW
EXECUTE FUNCTION public.set_support_ticket_number();

-- 4. Backfill existing rows (group by date of creation)
DO $$
DECLARE
  r record;
  v_date_part text;
  v_seq_per_day jsonb := '{}'::jsonb;
  v_n int;
BEGIN
  FOR r IN
    SELECT id, created_at
    FROM public.support_threads
    WHERE ticket_number IS NULL
    ORDER BY created_at ASC
  LOOP
    v_date_part := to_char(r.created_at AT TIME ZONE 'Asia/Dhaka', 'YYMMDD');
    v_n := COALESCE((v_seq_per_day ->> v_date_part)::int, 0) + 1;
    v_seq_per_day := jsonb_set(v_seq_per_day, ARRAY[v_date_part], to_jsonb(v_n));

    UPDATE public.support_threads
       SET ticket_number = 'TKT-' || v_date_part || '-' || lpad(v_n::text, 3, '0')
     WHERE id = r.id;
  END LOOP;
END $$;

-- 5. Enforce NOT NULL + UNIQUE + index
ALTER TABLE public.support_threads
  ALTER COLUMN ticket_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS support_threads_ticket_number_key
  ON public.support_threads (ticket_number);
