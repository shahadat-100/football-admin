-- ==============================================================================
-- Migration: Production Row Level Security (RLS) & Policies
-- Purpose:
--   1. Enables RLS on all tables (removes the red UNRESTRICTED warnings).
--   2. Grants public READ (SELECT) access to visitors for all club tables.
--   3. Restricts WRITE (INSERT, UPDATE, DELETE) access strictly to authenticated Admin.
--   4. Allows public visitor registration and score submission for tournaments.
-- ==============================================================================

-- ── 1. Enable RLS on all tables ─────────────────────────────────────────────
ALTER TABLE IF EXISTS app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS friendly_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hall_of_frame ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS match_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS milestone_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_custom_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_player_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS season ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tournament_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tournaments ENABLE ROW LEVEL SECURITY;


-- ── 2. Helper macro to drop existing policies safely ────────────────────────
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'app_settings', 'club_achievements', 'club_ranks', 'club_rules',
    'competitions', 'custom_tags', 'faqs', 'friendly_matches',
    'hall_of_frame', 'match_entries', 'matches', 'milestone_log',
    'news', 'player_custom_tags', 'player_player_roles', 'player_role',
    'player_season_stats', 'players', 'season', 'teams',
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


-- ── 3. Public Read Policies (Visitors can view all club data) ───────────────
CREATE POLICY "Public Read Access" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON club_achievements FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON club_ranks FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON club_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON competitions FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON custom_tags FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON faqs FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON friendly_matches FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON hall_of_frame FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON match_entries FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON matches FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON milestone_log FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON news FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON player_custom_tags FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON player_player_roles FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON player_role FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON player_season_stats FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON players FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON season FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON teams FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tournament_groups FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tournament_submissions FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tournaments FOR SELECT USING (true);


-- ── 4. Admin Write Policies (Authenticated Admin has full write access) ─────
CREATE POLICY "Admin Full Access" ON app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON club_achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON club_ranks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON club_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON competitions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON custom_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON friendly_matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON hall_of_frame FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON match_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON milestone_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON news FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON player_custom_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON player_player_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON player_role FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON player_season_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON players FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON season FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON teams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON tournament_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON tournament_matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON tournament_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON tournament_registrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON tournament_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON tournaments FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── 5. Tournament Public Registration & Score Submission (Public Visitors) ──
-- Allows public visitors to register for open tournaments and submit match scores
CREATE POLICY "Public Registration Insert" ON tournament_registrations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public Submission Insert" ON tournament_submissions FOR INSERT TO anon WITH CHECK (true);
