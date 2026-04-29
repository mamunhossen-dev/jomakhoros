
-- 1. Fix app_settings: anon can read public CMS rows but NOT subscription_page (which contains real bank details)
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;

CREATE POLICY "Anon can view public CMS settings"
ON public.app_settings
FOR SELECT
TO anon
USING (setting_key <> 'subscription_page');

CREATE POLICY "Authenticated can view all app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- 2. Lock down user_roles: restrict policies to authenticated only (remove public role exposure)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Make avatars bucket private (downloads via signed URLs / authenticated SELECT policy only)
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Ensure INSERT/UPDATE/DELETE on avatars are scoped to authenticated owners only
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4. Revoke EXECUTE from anon for SECURITY DEFINER helpers that should not be publicly callable
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_support_ticket_number() FROM anon, authenticated;
