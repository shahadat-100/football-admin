-- ==============================================================================
-- Migration: Fix Storage Image URLs for New Supabase Project
-- Project Ref: wrfsbsxigcaapvjityjv -> jwhjistshnelarinyzac
-- Extension: .png / .jpg / .jpeg -> .webp
-- Target: Only URLs containing '/storage/v1/object/public/'
-- ==============================================================================

BEGIN;

-- 1. Players: profileimageurl
UPDATE players
SET profileimageurl = regexp_replace(
  replace(profileimageurl, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE profileimageurl IS NOT NULL 
  AND profileimageurl LIKE '%/storage/v1/object/public/%';

-- 2. Players: coverimageurl
UPDATE players
SET coverimageurl = regexp_replace(
  replace(coverimageurl, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE coverimageurl IS NOT NULL 
  AND coverimageurl LIKE '%/storage/v1/object/public/%';

-- 3. News: image
UPDATE news
SET image = regexp_replace(
  replace(image, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE image IS NOT NULL 
  AND image LIKE '%/storage/v1/object/public/%';

-- 4. Club Ranks: image_url
UPDATE club_ranks
SET image_url = regexp_replace(
  replace(image_url, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE image_url IS NOT NULL 
  AND image_url LIKE '%/storage/v1/object/public/%';

-- 5. Club Achievements: image_url
UPDATE club_achievements
SET image_url = regexp_replace(
  replace(image_url, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE image_url IS NOT NULL 
  AND image_url LIKE '%/storage/v1/object/public/%';

-- 6. Tournaments: banner_url
UPDATE tournaments
SET banner_url = regexp_replace(
  replace(banner_url, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE banner_url IS NOT NULL 
  AND banner_url LIKE '%/storage/v1/object/public/%';

-- 7. Tournament Registrations: generated_card_url
UPDATE tournament_registrations
SET generated_card_url = regexp_replace(
  replace(generated_card_url, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE generated_card_url IS NOT NULL 
  AND generated_card_url LIKE '%/storage/v1/object/public/%';

-- 8. Tournament Matches: screenshot_url
UPDATE tournament_matches
SET screenshot_url = regexp_replace(
  replace(screenshot_url, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE screenshot_url IS NOT NULL 
  AND screenshot_url LIKE '%/storage/v1/object/public/%';

-- 9. Tournament Matches: auto_win_proof_url
UPDATE tournament_matches
SET auto_win_proof_url = regexp_replace(
  replace(auto_win_proof_url, 'wrfsbsxigcaapvjityjv', 'jwhjistshnelarinyzac'),
  '\.(png|jpe?g)$',
  '.webp',
  'i'
)
WHERE auto_win_proof_url IS NOT NULL 
  AND auto_win_proof_url LIKE '%/storage/v1/object/public/%';

COMMIT;
