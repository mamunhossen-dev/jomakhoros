
DROP POLICY "Authenticated users can submit feedback" ON public.feedback;
CREATE POLICY "Authenticated users can submit feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
