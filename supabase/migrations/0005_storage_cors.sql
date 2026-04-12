-- Configure CORS for planet-textures bucket
-- Three.js TextureLoader requires proper CORS headers for cross-origin image loading

UPDATE storage.buckets
SET owner = auth.uid()
WHERE id = 'planet-textures';

-- Ensure bucket is truly public with proper CORS support
UPDATE storage.buckets
SET public = true
WHERE id = 'planet-textures';

-- Drop existing read policy if it exists and recreate
DROP POLICY IF EXISTS "planet-textures public read" ON storage.objects;

CREATE POLICY "planet-textures public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'planet-textures');

-- Allow service role to manage all operations
DROP POLICY IF EXISTS "planet-textures service role manage" ON storage.objects;

CREATE POLICY "planet-textures service role manage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'planet-textures')
  WITH CHECK (bucket_id = 'planet-textures');
