-- ==============================================================================
-- TOURNAMENT ENGINE & BRACKET SYSTEM MIGRATION (STANDALONE COMPATIBLE)
-- Supports: Dynamic Equal Groups, BYE Dummy Slots, Dual Deadlines,
-- Viral FB Registration, Auto-Win Safeguards, and Tournament Awards.
-- ==============================================================================

-- 1. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    season_id BIGINT,
    season_name TEXT DEFAULT 'Season 1 • 2026',
    status TEXT NOT NULL DEFAULT 'registration_open' 
        CHECK (status IN ('draft', 'registration_open', 'group_stage', 'knockout_stage', 'completed')),
    group_size INTEGER NOT NULL DEFAULT 6,
    
    -- Timeline & Deadlines (A to Z)
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    registration_deadline TIMESTAMPTZ NOT NULL,
    group_match_days_interval INTEGER NOT NULL DEFAULT 2, -- days per matchday
    result_submission_grace_hours INTEGER NOT NULL DEFAULT 24, -- 1 day after match deadline
    final_deadline TIMESTAMPTZ,
    
    -- Settings & Customization
    primary_color TEXT NOT NULL DEFAULT '#00265a',
    accent_color TEXT NOT NULL DEFAULT '#c89850',
    banner_url TEXT,
    rules_text TEXT,
    
    -- Awards / Results
    champion_player_id TEXT,
    runner_up_player_id TEXT,
    third_place_player_id TEXT,
    golden_boot_player_id TEXT,
    mvp_player_id TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TOURNAMENT REGISTRATIONS (Viral FB Flow)
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    
    game_id TEXT NOT NULL,
    device_model TEXT NOT NULL,
    facebook_post_url TEXT NOT NULL,
    generated_card_url TEXT,
    
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_player_tournament_registration UNIQUE (tournament_id, player_id)
);

-- 3. TOURNAMENT GROUPS
CREATE TABLE IF NOT EXISTS public.tournament_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TOURNAMENT PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id TEXT,
    group_id UUID REFERENCES public.tournament_groups(id) ON DELETE SET NULL,
    
    game_id TEXT,
    device_model TEXT,
    is_dummy BOOLEAN NOT NULL DEFAULT FALSE,
    dummy_name TEXT DEFAULT 'BYE / Walkover',
    
    seed INTEGER,
    group_rank INTEGER,
    qualified_for_knockout BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TOURNAMENT MATCHES
CREATE TABLE IF NOT EXISTS public.tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'group' 
        CHECK (stage IN ('group', 'tie_breaker', 'round_of_64', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final')),
    group_id UUID REFERENCES public.tournament_groups(id) ON DELETE SET NULL,
    matchday INTEGER NOT NULL DEFAULT 1,
    bracket_match_number INTEGER,
    
    -- Schedule / Deadlines
    play_deadline TIMESTAMPTZ NOT NULL,
    submission_deadline TIMESTAMPTZ NOT NULL,
    
    -- Competitors
    player1_id TEXT,
    player2_id TEXT,
    player1_is_dummy BOOLEAN NOT NULL DEFAULT FALSE,
    player2_is_dummy BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Scores
    player1_score INTEGER,
    player2_score INTEGER,
    winner_id TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'pending_approval', 'disputed', 'completed', 'cancelled')),
    
    -- Auto-Win / Walkover Rules
    is_auto_win BOOLEAN NOT NULL DEFAULT FALSE,
    auto_win_player_id TEXT,
    auto_win_reason TEXT,
    auto_win_proof_url TEXT,
    
    -- Inactivity / Double No-show Rule
    is_inactive_double_loss BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Proof & OCR Stats
    screenshot_url TEXT,
    match_stats JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. MATCH SUBMISSIONS & AUTO-WIN CLAIMS LOG
CREATE TABLE IF NOT EXISTS public.tournament_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
    submitted_by_player_id TEXT NOT NULL,
    submission_type TEXT NOT NULL DEFAULT 'score' CHECK (submission_type IN ('score', 'auto_win_claim')),
    
    proposed_p1_score INTEGER,
    proposed_p2_score INTEGER,
    claim_reason TEXT,
    screenshot_url TEXT NOT NULL,
    ocr_extracted_data JSONB,
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'disputed', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Public read tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Public read registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Public insert registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Public read groups" ON public.tournament_groups;
DROP POLICY IF EXISTS "Public read participants" ON public.tournament_participants;
DROP POLICY IF EXISTS "Public read matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Public submit match" ON public.tournament_submissions;
DROP POLICY IF EXISTS "Public read submissions" ON public.tournament_submissions;

DROP POLICY IF EXISTS "Admin full tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admin full registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Admin full groups" ON public.tournament_groups;
DROP POLICY IF EXISTS "Admin full participants" ON public.tournament_participants;
DROP POLICY IF EXISTS "Admin full matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Admin full submissions" ON public.tournament_submissions;

-- Allow public read for tournament display
CREATE POLICY "Public read tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public read registrations" ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Public insert registrations" ON public.tournament_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read groups" ON public.tournament_groups FOR SELECT USING (true);
CREATE POLICY "Public read participants" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON public.tournament_matches FOR SELECT USING (true);
CREATE POLICY "Public submit match" ON public.tournament_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read submissions" ON public.tournament_submissions FOR SELECT USING (true);

-- Allow admin full control
CREATE POLICY "Admin full tournaments" ON public.tournaments FOR ALL USING (true);
CREATE POLICY "Admin full registrations" ON public.tournament_registrations FOR ALL USING (true);
CREATE POLICY "Admin full groups" ON public.tournament_groups FOR ALL USING (true);
CREATE POLICY "Admin full participants" ON public.tournament_participants FOR ALL USING (true);
CREATE POLICY "Admin full matches" ON public.tournament_matches FOR ALL USING (true);
CREATE POLICY "Admin full submissions" ON public.tournament_submissions FOR ALL USING (true);
