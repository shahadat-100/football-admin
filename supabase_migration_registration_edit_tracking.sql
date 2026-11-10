-- ==============================================================================
-- MIGRATION: ADD UPDATED_AT AND LAST_UPDATE_TYPE TO TOURNAMENT REGISTRATIONS
-- ==============================================================================
-- Run this in Supabase SQL Editor to support Admin Game ID & Device edits with 
-- date/time anti-cheat tracking on the official card.
-- ==============================================================================

ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_update_type TEXT 
    CHECK (last_update_type IN ('id', 'device', 'both'));

-- Add a comment for documentation
COMMENT ON COLUMN public.tournament_registrations.updated_at IS 'Timestamp of when Game ID or Device was last updated by admin';
COMMENT ON COLUMN public.tournament_registrations.last_update_type IS 'What was updated: id, device, or both';
