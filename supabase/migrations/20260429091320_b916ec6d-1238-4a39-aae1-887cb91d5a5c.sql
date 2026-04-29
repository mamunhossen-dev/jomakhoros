UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Ensure public read policy exists
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');