-- Create the planet-textures storage bucket
-- This bucket stores planet texture PNGs and is publicly readable.

INSERT INTO storage.buckets (id, name, public)
VALUES ('planet-textures', 'planet-textures', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access: anyone can view textures (needed for 3D rendering)
CREATE POLICY "planet-textures public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'planet-textures');

-- Service role only: upload/update/delete
-- (No need for explicit policy — service role bypasses RLS)
