-- Create Monthly Stats View
CREATE OR REPLACE VIEW player_monthly_stats AS
SELECT 
  playerid as player_id,
  season_id,
  EXTRACT(YEAR FROM date) as year,
  EXTRACT(MONTH FROM date) - 1 as month_index, -- JavaScript months are 0-indexed (0=January, 11=December)
  COUNT(id) as appearances,
  COUNT(CASE WHEN result = 'win' THEN 1 END) as wins,
  COUNT(CASE WHEN result = 'draw' THEN 1 END) as draws,
  COUNT(CASE WHEN result = 'loss' THEN 1 END) as losses,
  COALESCE(SUM(goals), 0) as goals,
  COALESCE(SUM(goalsconceded), 0) as goalsconceded,
  COUNT(CASE WHEN cleansheet = true THEN 1 END) as cleansheets,
  COALESCE(SUM(hattricks), 0) as hattricks,
  COUNT(CASE WHEN motm = true THEN 1 END) as motmcount
FROM match_entries
GROUP BY 
  playerid, 
  season_id, 
  EXTRACT(YEAR FROM date), 
  EXTRACT(MONTH FROM date);


-- Create Weekly Stats View
CREATE OR REPLACE VIEW player_weekly_stats AS
SELECT 
  playerid as player_id,
  season_id,
  EXTRACT(YEAR FROM date) as year,
  EXTRACT(MONTH FROM date) - 1 as month_index,
  CASE 
    WHEN EXTRACT(DAY FROM date) <= 7 THEN 1
    WHEN EXTRACT(DAY FROM date) <= 14 THEN 2
    WHEN EXTRACT(DAY FROM date) <= 21 THEN 3
    ELSE 4
  END as week,
  COUNT(id) as appearances,
  COUNT(CASE WHEN result = 'win' THEN 1 END) as wins,
  COUNT(CASE WHEN result = 'draw' THEN 1 END) as draws,
  COUNT(CASE WHEN result = 'loss' THEN 1 END) as losses,
  COALESCE(SUM(goals), 0) as goals,
  COALESCE(SUM(goalsconceded), 0) as goalsconceded,
  COUNT(CASE WHEN cleansheet = true THEN 1 END) as cleansheets,
  COALESCE(SUM(hattricks), 0) as hattricks,
  COUNT(CASE WHEN motm = true THEN 1 END) as motmcount
FROM match_entries
GROUP BY 
  playerid, 
  season_id, 
  EXTRACT(YEAR FROM date), 
  EXTRACT(MONTH FROM date),
  CASE 
    WHEN EXTRACT(DAY FROM date) <= 7 THEN 1
    WHEN EXTRACT(DAY FROM date) <= 14 THEN 2
    WHEN EXTRACT(DAY FROM date) <= 21 THEN 3
    ELSE 4
  END;
