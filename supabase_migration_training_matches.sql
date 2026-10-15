-- 1. Create Training Matches Table
CREATE TABLE public.training_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  season_id bigint NOT NULL,
  hometeam text NOT NULL DEFAULT 'The Elits'::text,
  awayteam text NOT NULL DEFAULT ''::text,
  homescore integer,
  awayscore integer,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'finished'::text CHECK (status = ANY (ARRAY['upcoming'::text, 'live'::text, 'finished'::text, 'cancelled'::text])),
  competition_id bigint,
  time time without time zone,
  CONSTRAINT training_matches_pkey PRIMARY KEY (id),
  CONSTRAINT training_matches_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.season(id),
  CONSTRAINT training_matches_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id)
);

-- 2. Create Training Match Entries Table
CREATE TABLE public.training_match_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playerid uuid NOT NULL,
  matchid uuid,
  goals integer DEFAULT 0,
  goalsconceded integer DEFAULT 0,
  hattricks integer DEFAULT 0,
  cleansheet boolean DEFAULT false,
  motm boolean DEFAULT false,
  result text DEFAULT 'draw'::text CHECK (result = ANY (ARRAY['win'::text, 'loss'::text, 'draw'::text])),
  notes text DEFAULT ''::text,
  season_id bigint NOT NULL,
  date date,
  time time without time zone,
  CONSTRAINT training_match_entries_pkey PRIMARY KEY (id),
  CONSTRAINT training_match_entries_playerid_fkey FOREIGN KEY (playerid) REFERENCES public.players(id),
  CONSTRAINT training_match_entries_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.season(id),
  CONSTRAINT training_match_entries_matchid_fkey FOREIGN KEY (matchid) REFERENCES public.training_matches(id) ON DELETE CASCADE
);

-- 3. Create view for Player Weekly Training Stats
CREATE OR REPLACE VIEW public.player_training_weekly_stats AS
SELECT 
    playerid AS player_id,
    season_id,
    EXTRACT(YEAR FROM date) AS year,
    EXTRACT(MONTH FROM date) - 1 AS month_index,
    CASE 
        WHEN EXTRACT(DAY FROM date) <= 7 THEN 1
        WHEN EXTRACT(DAY FROM date) <= 14 THEN 2
        WHEN EXTRACT(DAY FROM date) <= 21 THEN 3
        ELSE 4 
    END AS week,
    COUNT(id) AS appearances,
    SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws,
    SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
    SUM(goals) AS goals,
    SUM(goalsconceded) AS goalsconceded,
    SUM(CASE WHEN cleansheet THEN 1 ELSE 0 END) AS cleansheets,
    SUM(hattricks) AS hattricks,
    SUM(CASE WHEN motm THEN 1 ELSE 0 END) AS motmcount
FROM public.training_match_entries
GROUP BY 
    playerid, 
    season_id, 
    EXTRACT(YEAR FROM date), 
    EXTRACT(MONTH FROM date) - 1,
    CASE 
        WHEN EXTRACT(DAY FROM date) <= 7 THEN 1
        WHEN EXTRACT(DAY FROM date) <= 14 THEN 2
        WHEN EXTRACT(DAY FROM date) <= 21 THEN 3
        ELSE 4 
    END;

-- 4. Create view for Player Monthly Training Stats
CREATE OR REPLACE VIEW public.player_training_monthly_stats AS
SELECT 
    playerid AS player_id,
    season_id,
    EXTRACT(YEAR FROM date) AS year,
    EXTRACT(MONTH FROM date) - 1 AS month_index,
    COUNT(id) AS appearances,
    SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws,
    SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
    SUM(goals) AS goals,
    SUM(goalsconceded) AS goalsconceded,
    SUM(CASE WHEN cleansheet THEN 1 ELSE 0 END) AS cleansheets,
    SUM(hattricks) AS hattricks,
    SUM(CASE WHEN motm THEN 1 ELSE 0 END) AS motmcount
FROM public.training_match_entries
GROUP BY 
    playerid, 
    season_id, 
    EXTRACT(YEAR FROM date), 
    EXTRACT(MONTH FROM date) - 1;

-- 5. Create view for Player Season Training Stats
CREATE OR REPLACE VIEW public.player_training_season_stats AS
SELECT 
    playerid AS player_id,
    season_id,
    COUNT(id) AS appearances,
    SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws,
    SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
    SUM(goals) AS goals,
    SUM(goalsconceded) AS goalsconceded,
    SUM(CASE WHEN cleansheet THEN 1 ELSE 0 END) AS cleansheets,
    SUM(hattricks) AS hattricks,
    SUM(CASE WHEN motm THEN 1 ELSE 0 END) AS motmcount
FROM public.training_match_entries
GROUP BY 
    playerid, 
    season_id;
