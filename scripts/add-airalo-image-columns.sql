-- Add Airalo image and gradient columns to dataplans (run in Supabase SQL editor if missing)
-- Run once; safe to re-run (IF NOT EXISTS).

ALTER TABLE dataplans
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS gradient_start text,
  ADD COLUMN IF NOT EXISTS gradient_end text;

COMMENT ON COLUMN dataplans.image_url IS 'Airalo package/country image URL from API';
COMMENT ON COLUMN dataplans.gradient_start IS 'Airalo operator gradient start color';
COMMENT ON COLUMN dataplans.gradient_end IS 'Airalo operator gradient end color';
