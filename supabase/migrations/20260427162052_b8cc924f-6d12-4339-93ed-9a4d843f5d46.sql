
-- 1. Add 'transfer' to transaction_type enum
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'transfer';
