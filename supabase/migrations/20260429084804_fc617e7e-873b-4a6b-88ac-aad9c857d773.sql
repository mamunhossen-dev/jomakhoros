
-- 1) Feedback: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can delete feedback" ON public.feedback;

CREATE POLICY "Users can view own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can delete feedback"
ON public.feedback
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) Revoke EXECUTE on internal trigger / definer functions from anon & authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.ensure_support_thread() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_support_ticket_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_support_ticket_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_profile_subscription_fields() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.apply_transaction_wallet_balance() FROM anon, authenticated, public;

-- 3) Limit user-callable RPCs appropriately
-- has_role: only authenticated needs it (used by RLS policies under definer context anyway)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- touch_last_login: only authenticated users
REVOKE EXECUTE ON FUNCTION public.touch_last_login() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.touch_last_login() TO authenticated;

-- admin_set_user_block: only authenticated (function already checks admin role inside)
REVOKE EXECUTE ON FUNCTION public.admin_set_user_block(uuid, boolean, text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.admin_set_user_block(uuid, boolean, text) TO authenticated;
