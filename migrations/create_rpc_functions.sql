-- ==============================================================================
-- Migration: Essential Database RPC Functions for Football Platform
-- Project: https://jwhjistshnelarinyzac.supabase.co
-- Purpose: Powers Monthly & Weekly Ranked Leaderboards, Top XI, and Milestones
-- ==============================================================================

-- 1. get_player_stats_period (Powers Monthly & Weekly Points Leaderboards & Monthly Top XI)
CREATE OR REPLACE FUNCTION public.get_player_stats_period(
  p_start_date text DEFAULT NULL,
  p_end_date text DEFAULT NULL,
  p_season_id integer DEFAULT NULL
)
RETURNS TABLE (
  playerid text,
  matches bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  goals bigint,
  goalsconceded bigint,
  cleansheets bigint,
  hattricks bigint,
  motm_count bigint,
  points bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    me.playerid::text AS playerid,
    COUNT(me.id)::bigint AS matches,
    COUNT(CASE WHEN me.result = 'win' THEN 1 END)::bigint AS wins,
    COUNT(CASE WHEN me.result = 'draw' THEN 1 END)::bigint AS draws,
    COUNT(CASE WHEN me.result = 'loss' THEN 1 END)::bigint AS losses,
    COALESCE(SUM(me.goals), 0)::bigint AS goals,
    COALESCE(SUM(me.goalsconceded), 0)::bigint AS goalsconceded,
    COUNT(CASE WHEN me.cleansheet = true THEN 1 END)::bigint AS cleansheets,
    COALESCE(SUM(me.hattricks), 0)::bigint AS hattricks,
    COUNT(CASE WHEN me.motm = true THEN 1 END)::bigint AS motm_count,
    (
      (COUNT(CASE WHEN me.result = 'win' THEN 1 END) * 10) +
      (COUNT(CASE WHEN me.result = 'draw' THEN 1 END) * 5) -
      (COUNT(CASE WHEN me.result = 'loss' THEN 1 END) * 3) +
      COALESCE(SUM(me.goals), 0) -
      COALESCE(SUM(me.goalsconceded), 0) +
      (COUNT(CASE WHEN me.motm = true THEN 1 END) * 4) +
      COALESCE(SUM(me.hattricks), 0)
    )::bigint AS points
  FROM match_entries me
  WHERE (p_start_date IS NULL OR me.date::text >= p_start_date)
    AND (p_end_date IS NULL OR me.date::text <= p_end_date)
    AND (p_season_id IS NULL OR me.season_id = p_season_id)
  GROUP BY me.playerid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_player_stats_period(text, text, integer) TO anon, authenticated, service_role;


-- 2. get_player_milestone_data (Powers Player Detail Milestone Records)
CREATE OR REPLACE FUNCTION public.get_player_milestone_data(
  p_player_id text
)
RETURNS TABLE (
  id bigint,
  result text,
  goals integer,
  cleansheet boolean,
  hattricks integer,
  motm boolean,
  entry_date text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    me.id,
    me.result,
    me.goals,
    me.cleansheet,
    me.hattricks,
    me.motm,
    me.date::text AS entry_date,
    me.notes
  FROM match_entries me
  WHERE me.playerid::text = p_player_id
  ORDER BY me.date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_player_milestone_data(text) TO anon, authenticated, service_role;


-- 3. set_current_season (Powers Atomic Season Setting)
CREATE OR REPLACE FUNCTION public.set_current_season(
  p_season_id integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE season SET is_current = false;
  UPDATE season SET is_current = true WHERE id = p_season_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_current_season(integer) TO anon, authenticated, service_role;
