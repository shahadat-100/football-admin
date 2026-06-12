export const POSITIONS = ['Forward', 'Striker', 'Winger', 'Midfielder', 'Defender', 'Goalkeeper'] as const;
export const RESULTS = ['win', 'draw', 'loss'] as const;
export const MATCH_STATUSES = ['upcoming', 'live', 'finished', 'cancelled'] as const;
export const COMPETITIONS = ['Premier League', 'Champions League', 'FA Cup', 'EFL Cup', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];
export const NEWS_CATEGORIES = ['General', 'Player', 'League', 'Transfer', 'Injury'] as const;

export const RESULT_BADGE = {
  win: { bg: '#064e3b', c: '#6ee7b7' },
  draw: { bg: '#78350f', c: '#fcd34d' },
  loss: { bg: '#7f1d1d', c: '#fca5a5' }
};

export const STATUS_BADGE = {
  upcoming: { bg: '#1a1a1a', c: '#e5e5e5' },
  live: { bg: '#064e3b', c: '#6ee7b7' },
  finished: { bg: '#111111', c: '#9a9a9a' },
  cancelled: { bg: '#7f1d1d', c: '#fca5a5' }
};

export const HOME_TEAM = "The Enigmatic Elite";
export const WEEKLY_STAT_FIELDS = ['matches', 'win', 'loss', 'draw', 'goalsScored', 'goalsConceded', 'hattricks', 'motm', 'cleanSheet'] as const;
