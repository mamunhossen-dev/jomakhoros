-- 1. Wallet ownership validation in trigger
CREATE OR REPLACE FUNCTION public.apply_transaction_wallet_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Reverse OLD impact (UPDATE / DELETE) — only if wallet belongs to transaction owner
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    IF OLD.type = 'income' AND OLD.wallet_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.wallets WHERE id = OLD.wallet_id AND user_id = OLD.user_id) THEN
      UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'expense' AND OLD.wallet_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.wallets WHERE id = OLD.wallet_id AND user_id = OLD.user_id) THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'transfer' THEN
      IF OLD.wallet_id IS NOT NULL
         AND EXISTS (SELECT 1 FROM public.wallets WHERE id = OLD.wallet_id AND user_id = OLD.user_id) THEN
        UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
      END IF;
      IF OLD.to_wallet_id IS NOT NULL
         AND EXISTS (SELECT 1 FROM public.wallets WHERE id = OLD.to_wallet_id AND user_id = OLD.user_id) THEN
        UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.to_wallet_id;
      END IF;
    END IF;
  END IF;

  -- Apply NEW impact (INSERT / UPDATE) — validate ownership, raise on foreign wallet
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.wallet_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = NEW.wallet_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Wallet does not belong to this user';
    END IF;
    IF NEW.to_wallet_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = NEW.to_wallet_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Destination wallet does not belong to this user';
    END IF;

    IF NEW.type = 'income' AND NEW.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
    ELSIF NEW.type = 'expense' AND NEW.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
    ELSIF NEW.type = 'transfer' THEN
      IF NEW.wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
      END IF;
      IF NEW.to_wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.to_wallet_id;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Profile subscription field guard (prevent self-promotion to Pro)
CREATE OR REPLACE FUNCTION public.guard_profile_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.account_type       := OLD.account_type;
    NEW.payment_status     := OLD.payment_status;
    NEW.subscription_start := OLD.subscription_start;
    NEW.subscription_end   := OLD.subscription_end;
    NEW.trial_start_date   := OLD.trial_start_date;
    NEW.trial_end_date     := OLD.trial_end_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_subscription ON public.profiles;
CREATE TRIGGER trg_guard_profile_subscription
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_subscription_fields();

-- 3. Support messages: prevent forging admin messages
DROP POLICY IF EXISTS "Users send messages in own conversation" ON public.support_messages;
CREATE POLICY "Users send messages in own conversation"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    (auth.uid() = user_id AND is_from_admin = false)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  )
);

-- 4. Avatar bucket: restrict listing to authenticated users
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');