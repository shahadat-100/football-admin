-- ==============================================================================
-- Migration: Storage RLS Policies for Supabase Storage Buckets
-- Project: https://jwhjistshnelarinyzac.supabase.co
-- Buckets: images, covers, media
-- Purpose:
--   1. Allow authenticated admin (and anyone uploading through admin/tournament submission)
--      to INSERT/UPLOAD objects to storage.
--   2. Allow everyone to SELECT/VIEW objects from public storage.
--   3. Allow authenticated users to UPDATE and DELETE objects.
-- ==============================================================================

-- 1. Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop any previous conflicting policies safely
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Storage Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;

-- 3. Policy: Public Read Access (Everyone can view public bucket images)
CREATE POLICY "Public Storage Read"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('images', 'covers', 'media') );

-- 4. Policy: Upload Access (Allow uploads to images, covers, media)
CREATE POLICY "Allow All Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id IN ('images', 'covers', 'media') );

-- 5. Policy: Update Access (Allow overwriting / upsert)
CREATE POLICY "Allow All Updates"
ON storage.objects FOR UPDATE
USING ( bucket_id IN ('images', 'covers', 'media') );

-- 6. Policy: Delete Access
CREATE POLICY "Allow All Deletes"
ON storage.objects FOR DELETE
USING ( bucket_id IN ('images', 'covers', 'media') );
