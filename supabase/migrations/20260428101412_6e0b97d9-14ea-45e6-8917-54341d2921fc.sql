-- Restrict who can subscribe to Realtime channel topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Users may only subscribe to their own support channel; admins/moderators may subscribe to admin channels
CREATE POLICY "Authenticated can subscribe to own/admin channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    realtime.topic() = 'support-' || auth.uid()::text
  )
  OR (
    realtime.topic() LIKE 'admin-%'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    )
  )
);
