-- Fix last order (Burj UAE): set country_name where it's missing
-- Run in Supabase: SQL Editor → New query → paste → Run

-- Option A: Fix only the specific order
UPDATE orders
SET country_name = 'United Arab Emirates',
    updated_at = now()
WHERE order_id = 'burj-mobile-7days-1gb-1772591665161-d86iol8dh'
  AND country_code = 'AE'
  AND (country_name IS NULL OR country_name = '');

-- Option B: Fix ALL orders that have country_code but missing country_name
-- (Run this instead if you have more than one such order)
/*
UPDATE orders
SET country_name = CASE country_code
  WHEN 'AE' THEN 'United Arab Emirates'
  WHEN 'MX' THEN 'Mexico'
  WHEN 'US' THEN 'United States'
  WHEN 'GB' THEN 'United Kingdom'
  WHEN 'DE' THEN 'Germany'
  WHEN 'FR' THEN 'France'
  WHEN 'ES' THEN 'Spain'
  WHEN 'IT' THEN 'Italy'
  WHEN 'CA' THEN 'Canada'
  WHEN 'AU' THEN 'Australia'
  WHEN 'JP' THEN 'Japan'
  WHEN 'KR' THEN 'South Korea'
  WHEN 'IN' THEN 'India'
  WHEN 'BR' THEN 'Brazil'
  WHEN 'TR' THEN 'Turkey'
  WHEN 'EG' THEN 'Egypt'
  WHEN 'SA' THEN 'Saudi Arabia'
  WHEN 'TH' THEN 'Thailand'
  WHEN 'SG' THEN 'Singapore'
  WHEN 'MY' THEN 'Malaysia'
  WHEN 'ID' THEN 'Indonesia'
  WHEN 'PH' THEN 'Philippines'
  WHEN 'VN' THEN 'Vietnam'
  WHEN 'PL' THEN 'Poland'
  WHEN 'NL' THEN 'Netherlands'
  WHEN 'BE' THEN 'Belgium'
  WHEN 'CH' THEN 'Switzerland'
  WHEN 'AT' THEN 'Austria'
  WHEN 'PT' THEN 'Portugal'
  WHEN 'IE' THEN 'Ireland'
  WHEN 'NZ' THEN 'New Zealand'
  WHEN 'GR' THEN 'Greece'
  WHEN 'CZ' THEN 'Czech Republic'
  WHEN 'RO' THEN 'Romania'
  WHEN 'HU' THEN 'Hungary'
  WHEN 'SE' THEN 'Sweden'
  WHEN 'NO' THEN 'Norway'
  WHEN 'DK' THEN 'Denmark'
  WHEN 'FI' THEN 'Finland'
  WHEN 'IL' THEN 'Israel'
  WHEN 'ZA' THEN 'South Africa'
  ELSE country_name
END,
updated_at = now()
WHERE country_code IS NOT NULL
  AND (country_name IS NULL OR country_name = '');
*/

-- Option C: Set plan_name to include country (e.g. "1 GB - 7 days" → "1 GB - 7 days · United Arab Emirates")
-- Run this to fix orders where plan_name has no country suffix
UPDATE orders
SET plan_name = TRIM(plan_name) || ' · ' || COALESCE(country_name, '(' || country_code || ')'),
    updated_at = now()
WHERE (country_name IS NOT NULL OR country_code IS NOT NULL)
  AND plan_name IS NOT NULL
  AND plan_name != ''
  AND plan_name NOT LIKE '% · %';
