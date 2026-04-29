
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.apply_transaction_wallet_balance() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_profile_subscription_fields() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.ensure_support_thread() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_support_ticket_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_support_ticket_number() FROM public;
