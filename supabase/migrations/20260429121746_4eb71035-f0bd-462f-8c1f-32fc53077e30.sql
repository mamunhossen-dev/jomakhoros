
CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
