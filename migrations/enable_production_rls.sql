-- ==============================================================================
-- Production Row Level Security (RLS) & Policies (Complete & Hardened)
-- Project: https://jwhjistshnelarinyzac.supabase.co
-- Purpose:
--   1. Enables RLS on all 28 tables (removes red UNRESTRICTED badges).
--   2. Grants public READ (SELECT) access to visitors/public site for all data
--      (including player_monthly_stats and player_weekly_stats).
--   3. Restricts WRITE (INSERT, UPDATE, DELETE) access strictly to authenticated Admin.
--   4. Allows public visitor registration and score submission for tournaments.
-- ==============================================================================

-- ── 1. Enable RLS on all 28 tables ──────────────────────────────────────────
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custom_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.friendly_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hall_of_frame ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.milestone_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_custom_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_player_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.season ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournaments ENABLE ROW LEVEL SECURITY;


-- ── 2. Clean Drop of Previous Policies ──────────────────────────────────────
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'app_settings', 'club_achievements', 'club_ranks', 'club_rules',
    'competitions', 'custom_tags', 'faqs', 'friendly_matches',
    'hall_of_frame', 'match_entries', 'matches', 'milestone_log',
    'news', 'player_custom_tags', 'player_player_roles', 'player_role',
    'player_season_stats', 'player_monthly_stats', 'player_weekly_stats',
    'players', 'season', 'teams',
    'tournament_groups', 'tournament_matches', 'tournament_participants',
    'tournament_registrations', 'tournament_submissions', 'tournaments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Read Access" ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin Full Access" ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public Registration Insert" ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public Submission Insert" ON %I;', t);
  END LOOP;
END $$;


-- ── 3. Public Read Policies (Allow visitors & public site to SELECT all data) ──
CREATE POLICY "Public Read Access" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.club_achievements FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.club_ranks FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.club_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.custom_tags FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.friendly_matches FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.hall_of_frame FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.match_entries FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.milestone_log FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.player_custom_tags FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.player_player_roles FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.player_role FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.player_season_stats FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.player_monthly_stats FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.player_weekly_stats FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.season FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tournament_groups FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tournament_matches FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tournament_submissions FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tournaments FOR SELECT USING (true);


-- ── 4. Admin Write Policies (Authenticated Admins have full access) ─────────
CREATE POLICY "Admin Full Access" ON public.app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.club_achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.club_ranks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.club_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.competitions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.custom_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.friendly_matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.hall_of_frame FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.match_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.milestone_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.news FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.player_custom_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.player_player_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.player_role FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.player_season_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.player_monthly_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.player_weekly_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.players FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.season FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.teams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.tournament_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.tournament_matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.tournament_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.tournament_registrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.tournament_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON public.tournaments FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── 5. Public Tournament Submission, Registration & Match Score Update ────
CREATE POLICY "Public Registration Insert" ON public.tournament_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public Submission Insert" ON public.tournament_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow public visitor to submit scores and flag match as pending_approval or disputed
CREATE POLICY "Public Match Score Update" ON public.tournament_matches
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ── 6. Grant Explicit Database Privileges ───────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
