ALTER TABLE public.support_threads
  ALTER COLUMN ticket_number SET DEFAULT public.generate_support_ticket_number();
