CREATE POLICY "Admins can delete payments"
ON public.payment_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));