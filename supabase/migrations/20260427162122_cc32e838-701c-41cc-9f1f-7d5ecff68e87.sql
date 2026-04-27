
-- Add wallet columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS to_wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet_id ON public.transactions(to_wallet_id);

-- Trigger function: keep wallet balances in sync
CREATE OR REPLACE FUNCTION public.apply_transaction_wallet_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reverse OLD impact (UPDATE / DELETE)
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    IF OLD.type = 'income' AND OLD.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'expense' AND OLD.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'transfer' THEN
      IF OLD.wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
      END IF;
      IF OLD.to_wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.to_wallet_id;
      END IF;
    END IF;
  END IF;

  -- Apply NEW impact (INSERT / UPDATE)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
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
$$;

DROP TRIGGER IF EXISTS trg_transactions_wallet_balance ON public.transactions;
CREATE TRIGGER trg_transactions_wallet_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.apply_transaction_wallet_balance();
