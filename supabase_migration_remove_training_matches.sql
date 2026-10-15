-- 1. Drop the views first (since they depend on the tables)
DROP VIEW IF EXISTS public.player_training_weekly_stats;
DROP VIEW IF EXISTS public.player_training_monthly_stats;
DROP VIEW IF EXISTS public.player_training_season_stats;

-- 2. Drop the entries table (which has a foreign key to matches)
DROP TABLE IF EXISTS public.training_match_entries;

-- 3. Drop the main matches table
DROP TABLE IF EXISTS public.training_matches;
