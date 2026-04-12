-- Configure CORS for planet-textures bucket
-- Three.js TextureLoader requires proper CORS headers for cross-origin image loading
-- and the browser requires Access-Control-Allow-Origin for fetch() + blob approach

-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'planet-textures';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "planet-textures public read" ON storage.objects;
DROP POLICY IF EXISTS "planet-textures service role manage" ON storage.objects;

-- Public read access
CREATE POLICY "planet-textures public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'planet-textures');

-- Allow all authenticated operations (service role uses RLS bypass)
CREATE POLICY "planet-textures all operations"
  ON storage.objects FOR ALL
  USING (bucket_id = 'planet-textures')
  WITH CHECK (bucket_id = 'planet-textures');

