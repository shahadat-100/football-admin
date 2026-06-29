import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Player, SeasonDb, PlayerSeasonStat, MonthlyStat } from '@/features/players/types';
import { Match } from '@/features/matches/types';
import { MatchEntry } from '@/features/match-entries/types';
import { NewsArticle } from '@/features/news/types';
import { supabase } from '@/lib/supabase';


export interface HallOfFameEntry {
  id: number;
  createdAt: string;
  playerId: string;
  category: string;
  seasonText: string;
  subTitle: string;
  descriptions: string;
}

export interface Competition {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlayerRole {
  id: number;
  name: string;
  status: boolean;
  createdAt: string;
}

export interface CustomTag {
  id: number;
  name: string;
  status: boolean;
  createdAt: string;
}

export interface ClubRule {
  id: number;
  createdAt: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface ClubRank {
  id: number;
  createdAt: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface ClubAchievement {
  id: number;
  createdAt: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
}

// ── Database Mapping Helpers ─────────────────────────────────────────

export const mapClubRuleFromDb = (r: any): ClubRule => ({
  id: r.id,
  createdAt: r.created_at,
  title: r.title,
  subtitle: r.subtitle || '',
  description: r.description || '',
});

export const mapClubRuleToDb = (r: any) => ({
  title: r.title,
  subtitle: r.subtitle || null,
  description: r.description || null,
});

export const mapClubRankFromDb = (r: any): ClubRank => ({
  id: r.id,
  createdAt: r.created_at,
  imageUrl: r.image_url || '',
  title: r.title,
  subtitle: r.subtitle || '',
  description: r.description || '',
});

export const mapClubRankToDb = (r: any) => ({
  image_url: r.imageUrl || null,
  title: r.title,
  subtitle: r.subtitle || null,
  description: r.description || null,
});

export const mapClubAchievementFromDb = (a: any): ClubAchievement => ({
  id: a.id,
  createdAt: a.created_at,
  imageUrl: a.image_url || '',
  title: a.title,
  subtitle: a.subtitle || '',
  description: a.description || '',
});

export const mapClubAchievementToDb = (a: any) => ({
  image_url: a.imageUrl || null,
  title: a.title,
  subtitle: a.subtitle || null,
  description: a.description || null,
});

export const mapPlayerFromDb = (p: any): Player => ({
  id: p.id,
  name: p.name,
  profileImageUrl: p.profileimageurl || '',
  coverImageUrl: (p as any).coverimageurl || '',
  jerseyNumber: p.jerseynumber ?? undefined,
  email: p.email || '',
  // Extract role names from the joined junction table data
  playerRoles: (p.player_player_roles ?? []).map((r: any) => r.player_role?.name).filter(Boolean),
  // Extract tag names from the joined junction table data
  customTags: (p.player_custom_tags ?? []).map((t: any) => t.custom_tags?.name).filter(Boolean),
  customStringTags: Array.isArray(p.custom_string_tags) ? p.custom_string_tags : [],
  createdAt: p.createdat || '',
  seasons: [],
});

// Only send columns that actually exist on the players table
export const mapPlayerToDb = (p: any) => ({
  name: p.name,
  profileimageurl: p.profileImageUrl || '',
  coverimageurl: p.coverImageUrl || '',
  jerseynumber: p.jerseyNumber ?? null,
  email: p.email || null,
  custom_string_tags: Array.isArray(p.customStringTags) ? p.customStringTags : [],
});

export const mapMatchFromDb = (m: any): Match => ({
  id: m.id,
  seasonId: m.season_id,
  homeTeam: m.hometeam,
  awayTeam: m.awayteam,
  homeScore: m.homescore,
  awayScore: m.awayscore,
  date: m.date,
  time: m.time || null,
  status: m.status,
  competitionId: m.competition_id,
  competition: m.competitions?.name || '',
});

export const mapMatchToDb = (m: any) => ({
  season_id: m.seasonId,
  hometeam: m.homeTeam,
  awayteam: m.awayTeam,
  homescore: m.homeScore,
  awayscore: m.awayScore,
  date: m.date,
  time: m.time || null,
  status: m.status,
  competition_id: m.competitionId,
});

export const mapMatchEntryFromDb = (e: any): MatchEntry => ({
  id: e.id,
  playerId: e.playerid,
  matchId: e.matchid || '',
  goals: e.goals || 0,
  goalsConceded: e.goalsconceded || 0,
  result: e.result,
  hattricks: e.hattricks || 0,
  cleanSheet: e.cleansheet || false,
  motm: e.motm || false,
  date: e.date || e.matches?.date || '',
  time: e.time || null,
  notes: e.notes || '',
  seasonId: e.season_id,
});

export const mapMatchEntryToDb = (e: any) => ({
  playerid: e.playerId,
  matchid: e.matchId || null,
  goals: e.goals || 0,
  goalsconceded: e.goalsConceded || 0,
  result: e.result,
  hattricks: e.hattricks || 0,
  cleansheet: e.cleanSheet || false,
  motm: e.motm || false,
  notes: e.notes || '',
  season_id: e.seasonId,
  date: e.date || null,
  time: e.time || null,
});

export const mapHallOfFameFromDb = (h: any): HallOfFameEntry => ({
  id: h.id,
  createdAt: h.created_at,
  playerId: h.player_id,
  category: h.category,
  seasonText: h.season_text,
  subTitle: h.sub_title,
  descriptions: h.descriptions,
});

export const mapHallOfFameToDb = (h: any) => ({
  player_id: h.playerId,
  category: h.category,
  season_text: h.seasonText,
  sub_title: h.subTitle,
  descriptions: h.descriptions,
});

interface FootballStore {
  players: Player[];
  matches: Match[];
  matchEntries: MatchEntry[];
  news: NewsArticle[];
  seasons: SeasonDb[];
  playerSeasonStats: PlayerSeasonStat[];
  competitions: Competition[];
  hallOfFame: HallOfFameEntry[];
  availableRoles: PlayerRole[];
  availableTags: CustomTag[];
  clubRules: ClubRule[];
  clubRanks: ClubRank[];
  clubAchievements: ClubAchievement[];

  // Server-side paginated entries (for MatchEntries page)
  paginatedMatchEntries: MatchEntry[];
  totalMatchEntriesCount: number;
  globalMatchEntriesCount: number;
  isPaginatedEntriesLoading: boolean;
  matchEntriesLoaded: boolean;
  globalCounts: Record<string, number>;
  fetchGlobalCounts: () => Promise<void>;
  
  isInitialized: boolean;
  initializeData: () => Promise<void>;
  fetchPaginatedMatchEntries: (page: number, pageSize: number, searchPlayerIds?: string[]) => Promise<void>;
  fetchPlayerStatsPeriod: (startDate: string | null, endDate: string | null, seasonId: number | null) => Promise<any[]>;
  
  fetchPlayers: () => Promise<void>;
  setPlayers: (p: Player[]) => void;
  addPlayer: (p: Player) => Promise<void>;
  updatePlayer: (p: Player) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  
  fetchMatches: () => Promise<void>;
  setMatches: (m: Match[]) => void;
  addMatch: (m: Match | Omit<Match, 'id'>) => Promise<string | undefined>;
  updateMatch: (m: Match) => Promise<void>;
  removeMatch: (id: string) => Promise<void>;
  
  fetchMatchEntries: (force?: boolean) => Promise<void>;
  setMatchEntries: (e: MatchEntry[]) => void;
  addMatchEntry: (e: MatchEntry | Omit<MatchEntry, 'id'>) => Promise<void>;
  updateMatchEntry: (e: MatchEntry) => Promise<void>;
  removeMatchEntry: (id: string) => Promise<void>;
  
  fetchNews: () => Promise<void>;
  setNews: (n: NewsArticle[]) => void;
  addNews: (n: NewsArticle) => Promise<void>;
  updateNews: (n: NewsArticle) => Promise<void>;
  removeNews: (id: string) => Promise<void>;

  fetchSeasons: () => Promise<void>;
  addSeason: (name: string) => Promise<SeasonDb | undefined>;
  setCurrentSeason: (id: number) => Promise<void>;

  fetchPlayerSeasonStats: () => Promise<void>;
  repairPlayerSeasonStat: (statId: string, patch: Partial<{ motmcount: number; cleansheets: number; goals: number; hattricks: number; appearances: number; wins: number; draws: number; losses: number; goalsconceded: number }>) => Promise<void>;
  repairPlayerMonthlyStats: (playerId: string, seasonId: number, year: number, month: number, target: MonthlyStat) => Promise<void>;
  recheckMilestones: (playerId: string) => Promise<{ fired: boolean }>;
  fetchCompetitions: () => Promise<void>;
  fetchAvailableRoles: () => Promise<void>;
  fetchAvailableTags: () => Promise<void>;

  fetchHallOfFame: () => Promise<void>;
  addHallOfFameEntry: (entry: Omit<HallOfFameEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateHallOfFameEntry: (entry: HallOfFameEntry) => Promise<void>;
  removeHallOfFameEntry: (id: number) => Promise<void>;

  fetchClubRules: () => Promise<void>;
  addClubRule: (rule: Omit<ClubRule, 'id' | 'createdAt'>) => Promise<void>;
  updateClubRule: (rule: ClubRule) => Promise<void>;
  removeClubRule: (id: number) => Promise<void>;

  fetchClubRanks: () => Promise<void>;
  addClubRank: (rank: Omit<ClubRank, 'id' | 'createdAt'>) => Promise<void>;
  updateClubRank: (rank: ClubRank) => Promise<void>;
  removeClubRank: (id: number) => Promise<void>;

  fetchClubAchievements: () => Promise<void>;
  addClubAchievement: (achievement: Omit<ClubAchievement, 'id' | 'createdAt'>) => Promise<void>;
  updateClubAchievement: (achievement: ClubAchievement) => Promise<void>;
  removeClubAchievement: (id: number) => Promise<void>;
}


// ── Upsert Roles & Tags to Junction Tables ───────────────────────────

// Sync player roles via junction table — roles are pre-defined, just look up by name
// FIX 1: Batch lookup (1 query) + bulk insert (1 query) instead of 2N sequential queries.
const syncPlayerRoles = async (playerId: string, roles: string[]) => {
  await supabase.from('player_player_roles').delete().eq('player_id', playerId);
  if (!roles || roles.length === 0) return;

  const trimmed = roles.map(r => r.trim()).filter(Boolean);
  if (trimmed.length === 0) return;

  // 1 query: fetch all matching role IDs at once
  const { data: roleRows } = await supabase
    .from('player_role')
    .select('id, name')
    .in('name', trimmed);

  if (!roleRows?.length) return;

  // 1 query: bulk insert all junction rows
  await supabase
    .from('player_player_roles')
    .insert(roleRows.map(r => ({ player_id: playerId, role_id: r.id })));
};

// Sync player tags via junction table — tags are pre-defined, just look up by name
// FIX 1: Batch lookup (1 query) + bulk insert (1 query) instead of 2N sequential queries.
const syncPlayerTags = async (playerId: string, tags: string[]) => {
  await supabase.from('player_custom_tags').delete().eq('player_id', playerId);
  if (!tags || tags.length === 0) return;

  const trimmed = tags.map(t => t.trim()).filter(Boolean);
  if (trimmed.length === 0) return;

  // 1 query: fetch all matching tag IDs at once
  const { data: tagRows } = await supabase
    .from('custom_tags')
    .select('id, name')
    .in('name', trimmed);

  if (!tagRows?.length) return;

  // 1 query: bulk insert all junction rows
  await supabase
    .from('player_custom_tags')
    .insert(tagRows.map(t => ({ player_id: playerId, tag_id: t.id })));
};

// ── Background Aggregation Sync Helper ───────────────────────────────


const updatePlayerSeasonStats = async (playerId: string, seasonId: number) => {
  // FIX 4: Project only the columns needed for aggregation — drops notes, time, date, matchid, etc.
  const { data: entries, error } = await supabase
    .from('match_entries')
    .select('goals, goalsconceded, cleansheet, hattricks, motm, result, matches(status)')
    .eq('playerid', playerId)
    .eq('season_id', seasonId);

  if (error || !entries) {
    console.error('Error fetching entries for stats:', error);
    return;
  }

  const appearances = entries.length;
  const goals = entries.reduce((s, e) => s + (e.goals || 0), 0);
  const cleansheets = entries.filter(e => e.cleansheet).length;
  const hattricks = entries.reduce((s, e) => s + (e.hattricks || 0), 0);
  const motmcount = entries.filter(e => e.motm).length;
  const wins = entries.filter(e => e.result === 'win').length;
  const draws = entries.filter(e => e.result === 'draw').length;
  const losses = entries.filter(e => e.result === 'loss').length;
  const goalsconceded = entries.reduce((s, e) => s + (e.goalsconceded || 0), 0);

  const { data: existing } = await supabase
    .from('player_season_stats')
    .select('id')
    .eq('player_id', playerId)
    .eq('season_id', seasonId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('player_season_stats')
      .update({
        appearances,
        goals,
        cleansheets,
        hattricks,
        motmcount,
        wins,
        draws,
        losses,
        goalsconceded,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('player_season_stats')
      .insert({
        player_id: playerId,
        season_id: seasonId,
        appearances,
        goals,
        cleansheets,
        hattricks,
        motmcount,
        wins,
        draws,
        losses,
        goalsconceded,
        updated_at: new Date().toISOString()
      });
  }
};

// ── Milestone System ──────────────────────────────────────────────────

const GOAL_MILESTONES        = Array.from({ length: 50 }, (_, i) => (i + 1) * 100); // 100..5000
const MOTM_MILESTONES        = [10, 25, 50, 100, 200, 500, 1000];
const CLEAN_SHEET_MILESTONES = [100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const HATTRICK_MILESTONES    = [100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const APPEARANCE_MILESTONES  = [50, 100, 200, 300, 500, 1000, 1500, 2000, 3000];
const WIN_MILESTONES         = [50, ...Array.from({ length: 49 }, (_, i) => (i + 1) * 100)]; // 50,100..5000
const WIN_STREAK_MILESTONES  = [5, 10, 15, 20];
const UNBEATEN_MILESTONES    = [10, 15, 20];

const _milestoneTitle = (name: string, key: string, n: number, emoji: string): string => {
  if (key.startsWith('goals'))       return `${emoji} ${name} Scores ${n} Career Goals!`;
  if (key.startsWith('motm'))        return `${emoji} ${name} Wins ${n}th MOTM Award!`;
  if (key.startsWith('cleansheets')) return `${emoji} ${name} Reaches ${n} Clean Sheets!`;
  if (key.startsWith('hattricks'))   return `${emoji} ${name} Scores ${n} Hat-tricks!`;
  if (key.startsWith('appearances')) return `${emoji} ${name} Makes ${n} Appearances!`;
  if (key.startsWith('wins'))        return `${emoji} ${name} Celebrates ${n} Career Wins!`;
  if (key.startsWith('win_streak'))  return `${emoji} ${name} On a ${n}-Game Winning Streak!`;
  if (key.startsWith('unbeaten'))    return `${emoji} ${name} Goes ${n} Games Unbeaten!`;
  return `${emoji} ${name} Reaches a New Milestone!`;
};

const _milestoneContent = (name: string, key: string, n: number): string => {
  if (key.startsWith('goals'))       return `${name} has scored an incredible ${n} career goals for The Enigmatic Elite. A true goalscoring legend! ⚽🔥`;
  if (key.startsWith('motm'))        return `${name} has won the Man of the Match award ${n} times. Consistently outstanding! 🏅`;
  if (key.startsWith('cleansheets')) return `${name} has kept ${n} clean sheets — an absolute wall at the back! 🧤`;
  if (key.startsWith('hattricks'))   return `${name} has scored ${n} hat-tricks for the club. A record-breaking feat! 🎩`;
  if (key.startsWith('appearances')) return `${name} has made ${n} appearances for The Enigmatic Elite. A true club servant! 📅`;
  if (key.startsWith('wins'))        return `${name} has been part of ${n} winning performances. A born winner! 🏆`;
  if (key.startsWith('win_streak'))  return `${name} is on fire — currently on a ${n}-match winning streak! 🔥`;
  if (key.startsWith('unbeaten'))    return `${name} has gone ${n} consecutive matches without defeat. An incredible run! 🛡️`;
  return `${name} has reached an incredible milestone for the club! 🎉`;
};

const checkAndFireMilestones = async (playerId: string): Promise<boolean> => {
  try {
    const { data: player } = await supabase.from('players').select('name, profileimageurl').eq('id', playerId).single();
    if (!player) return false;
    const playerName = player.name;
    // Use the player's existing profile image URL for the news article.
    // We do NOT upload or copy the image — just reference the same URL already in storage.
    const playerImageUrl: string | null = (player as any).profileimageurl || null;

    // (statsRows fetch removed — it was fetched but never used beyond the null check,
    // making it a dead round-trip on every milestone evaluation.)

    // FIX 3: Use RPC instead of a full match_entries scan with an embedded join.
    // The function returns result, goals, cleansheet, hattricks, motm, entry_date, notes
    // already sorted ascending by date — eliminating the client-side sort and the join.
    const { data: entries } = await supabase
      .rpc('get_player_milestone_data', { p_player_id: playerId });

    const sorted = ((entries ?? []) as any[])
      .map(e => ({ ...e, date: e.entry_date }))
      .filter(e => e.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let rGoals = 0, rCleansheets = 0, rHattricks = 0, rApps = 0, rMotm = 0, rWins = 0;
    let currentWinStreak = 0, currentUnbeatenStreak = 0;
    const milestoneDates = new Map<string, string>();

    const checkThresholds = (thresholds: number[], currentVal: number, stat: string, date: string, emoji: string) => {
      for (const t of thresholds) {
        if (currentVal >= t) {
          const key = `${stat}_${t}`;
          if (!milestoneDates.has(key)) milestoneDates.set(key, JSON.stringify({ date, emoji, t }));
        }
      }
    };

    for (const e of sorted) {
      const d = e.date;
      rApps++;
      rGoals += (e.goals || 0);
      rHattricks += (e.hattricks || 0);
      if (e.cleansheet) rCleansheets++;
      if (e.motm) rMotm++;
      
      if (e.result === 'win') { rWins++; }
      
      const isGeneratedMatch = e.notes && e.notes.startsWith('Historical - Season');
      if (!isGeneratedMatch) {
        if (e.result === 'win') { currentWinStreak++; currentUnbeatenStreak++; }
        else if (e.result === 'draw') { currentWinStreak = 0; currentUnbeatenStreak++; }
        else { currentWinStreak = 0; currentUnbeatenStreak = 0; }
      }

      checkThresholds(GOAL_MILESTONES,        rGoals,                'goals',       d, '⚽');
      checkThresholds(MOTM_MILESTONES,        rMotm,                 'motm',        d, '🏅');
      checkThresholds(CLEAN_SHEET_MILESTONES, rCleansheets,          'cleansheets', d, '🧤');
      checkThresholds(HATTRICK_MILESTONES,    rHattricks,            'hattricks',   d, '🎩');
      checkThresholds(APPEARANCE_MILESTONES,  rApps,                 'appearances', d, '📅');
      checkThresholds(WIN_MILESTONES,         rWins,                 'wins',        d, '🏆');
      checkThresholds(WIN_STREAK_MILESTONES,  currentWinStreak,      'win_streak',  d, '🔥');
      checkThresholds(UNBEATEN_MILESTONES,    currentUnbeatenStreak, 'unbeaten',    d, '🛡️');
    }

    if (milestoneDates.size === 0) return false;

    const { data: logged } = await supabase
      .from('milestone_log').select('milestone_key').eq('player_id', playerId);
    const loggedKeys = new Set((logged ?? []).map((l: any) => l.milestone_key));
    
    let firedAny = false;

    for (const [key, valStr] of milestoneDates.entries()) {
      if (loggedKeys.has(key)) continue;
      
      const { date, emoji, t } = JSON.parse(valStr);

      const { error: logErr } = await supabase.from('milestone_log').insert({
        player_id: playerId,
        milestone_key: key,
      });
      if (logErr) continue;

      // Attach the player's existing profile image as the news image.
      // The URL is already persisted in the players table — no re-upload needed.
      const newsPayload: Record<string, any> = {
        title:    _milestoneTitle(playerName, key, t, emoji),
        content:  _milestoneContent(playerName, key, t),
        author:   'Club Records',
        category: 'Milestone',
        hot:      true,
        date:     date, // EXACT date it happened
      };
      if (playerImageUrl) {
        newsPayload.image = playerImageUrl;
      }
      await supabase.from('news').insert(newsPayload);
      firedAny = true;
    }
    return firedAny;
  } catch (err) {
    console.error('Milestone check error:', err);
    return false;
  }
};

export const useFootballStore = create<FootballStore>()(
  devtools(
    (set, get) => ({
      players: [],
      matches: [],
      matchEntries: [],
      news: [],
      seasons: [],
      playerSeasonStats: [],
      competitions: [],
      hallOfFame: [],
      availableRoles: [],
      availableTags: [],
      clubRules: [],
      clubRanks: [],
      clubAchievements: [],

      paginatedMatchEntries: [],
      totalMatchEntriesCount: 0,
      globalMatchEntriesCount: 0,
      isPaginatedEntriesLoading: false,
      matchEntriesLoaded: false,
      globalCounts: {
        players: 0,
        matches: 0,
        news: 0,
        'hall-of-fame': 0,
      },

      fetchGlobalCounts: async () => {
        try {
          const [playersRes, matchesRes, newsRes, hofRes] = await Promise.all([
            supabase.from('players').select('id', { count: 'exact', head: true }),
            supabase.from('matches').select('id', { count: 'exact', head: true }),
            supabase.from('news').select('id', { count: 'exact', head: true }),
            supabase.from('hall_of_frame').select('id', { count: 'exact', head: true }),
          ]);
          
          set({
            globalCounts: {
              players: playersRes.count || 0,
              matches: matchesRes.count || 0,
              news: newsRes.count || 0,
              'hall-of-fame': hofRes.count || 0,
            }
          });
        } catch (err) {
          console.error('Error fetching global counts:', err);
        }
      },
      
      isInitialized: false,
      initializeData: async () => {
        // Smart caching: skip if already initialized
        if (get().isInitialized) return;
        const store = get();
        // Step 1: Fetch seasons first and fetch global counts for navigation badges
        await Promise.all([
          store.fetchSeasons(),
          store.fetchGlobalCounts(),
        ]);
        
        set({ isInitialized: true });
      },


      fetchPaginatedMatchEntries: async (page, pageSize, searchPlayerIds) => {
        set({ isPaginatedEntriesLoading: true });
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        // Issue 6 fix: project only columns mapMatchEntryFromDb reads
        let query = supabase
          .from('match_entries')
          .select('id, playerid, matchid, goals, goalsconceded, result, hattricks, cleansheet, motm, date, time, notes, season_id', { count: 'exact' })
          .order('date', { ascending: false })
          .range(from, to);

        if (searchPlayerIds && searchPlayerIds.length > 0) {
          query = query.in('playerid', searchPlayerIds);
        } else if (searchPlayerIds && searchPlayerIds.length === 0) {
          // No matching players → return empty immediately
          set({ paginatedMatchEntries: [], totalMatchEntriesCount: 0, isPaginatedEntriesLoading: false });
          return;
        }

        const { data, error, count } = await query;
        if (data) {
          set({
            paginatedMatchEntries: data.map(mapMatchEntryFromDb),
            totalMatchEntriesCount: count ?? 0,
            isPaginatedEntriesLoading: false,
          });
        }
        if (error) {
          console.error('Error fetching paginated match entries:', error);
          set({ isPaginatedEntriesLoading: false });
        }
      },

      fetchPlayerStatsPeriod: async (startDate, endDate, seasonId) => {
        const { data, error } = await supabase.rpc('get_player_stats_period', {
          p_start_date: startDate,
          p_end_date: endDate,
          p_season_id: seasonId
        });
        if (error) {
          console.error('Error fetching player stats period via RPC:', error);
          return [];
        }
        return data || [];
      },
      
      fetchPlayers: async () => {
        if (get().players.length > 0) return;
        try {
          // Fetch all related tables in parallel to avoid sequential waterfall.
          // We select specific columns but include profileimageurl again. 
          // Future uploads are resized so they won't bloat the payload.
          // Issue 7 fix: project only needed columns on junction/lookup tables
          const [playersRes, junctionRolesRes, rolesRes, junctionTagsRes, tagsRes] = await Promise.all([
            supabase.from('players').select('id, name, jerseynumber, email, custom_string_tags, createdat, profileimageurl, coverimageurl'),
            supabase.from('player_player_roles').select('player_id, role_id'),
            supabase.from('player_role').select('id, name'),
            supabase.from('player_custom_tags').select('player_id, tag_id'),
            supabase.from('custom_tags').select('id, name')
          ]);

          if (playersRes.error) throw playersRes.error;

          const players = playersRes.data || [];
          const junctionRoles = junctionRolesRes.data || [];
          const roles = rolesRes.data || [];
          const junctionTags = junctionTagsRes.data || [];
          const tags = tagsRes.data || [];

          // Create lookup maps
          const roleMap = new Map(roles.map(r => [r.id, r.name]));
          const tagMap = new Map(tags.map(t => [t.id, t.name]));

          // Group by player_id
          const playerRolesMap = new Map<string, string[]>();
          junctionRoles.forEach(jr => {
            const roleName = roleMap.get(jr.role_id);
            if (roleName) {
              if (!playerRolesMap.has(jr.player_id)) playerRolesMap.set(jr.player_id, []);
              playerRolesMap.get(jr.player_id)!.push(roleName);
            }
          });

          const playerTagsMap = new Map<string, string[]>();
          junctionTags.forEach(jt => {
            const tagName = tagMap.get(jt.tag_id);
            if (tagName) {
              if (!playerTagsMap.has(jt.player_id)) playerTagsMap.set(jt.player_id, []);
              playerTagsMap.get(jt.player_id)!.push(tagName);
            }
          });

          // Map to Player type manually
          const mappedPlayers = players.map(p => ({
            id: p.id,
            name: p.name,
            profileImageUrl: (p as any).profileimageurl || '',
            coverImageUrl: (p as any).coverimageurl || '',
            jerseyNumber: p.jerseynumber ?? undefined,
            email: p.email || '',
            playerRoles: playerRolesMap.get(p.id) || [],
            customTags: playerTagsMap.get(p.id) || [],
            customStringTags: Array.isArray(p.custom_string_tags) ? p.custom_string_tags : [],
            createdAt: p.createdat || '',
            seasons: [],
          }));

          set({ players: mappedPlayers });
        } catch (error) {
          console.error('Error fetching players:', error);
        }
      },
      setPlayers: (players) => set({ players }),
      
      addPlayer: async (p) => {
        const { seasons, ...profileData } = p as any;
        const playerData = mapPlayerToDb(profileData);
        
        const { data, error } = await supabase.from('players').insert([playerData]).select('id, name, jerseynumber, email, custom_string_tags, createdat, profileimageurl, coverimageurl').single();
        if (error) {
          console.error('Error adding player:', error);
          alert('Failed to save player: ' + error.message);
          return;
        }

        if (data) {
          const newPlayerId = data.id;
          const playerRoles: string[] = profileData.playerRoles || [];
          const customTags: string[] = profileData.customTags || [];

          // Sync roles & tags via junction tables
          await syncPlayerRoles(newPlayerId, playerRoles).catch(console.error);
          await syncPlayerTags(newPlayerId, customTags).catch(console.error);

          // Issue 10 fix: build the player object from in-memory data — no re-fetch needed.
          // We already know the roles and tags we just synced.
          const newPlayer: Player = {
            id: newPlayerId,
            name: data.name,
            profileImageUrl: (data as any).profileimageurl || '',
            coverImageUrl: (data as any).coverimageurl || '',
            jerseyNumber: (data as any).jerseynumber ?? undefined,
            email: data.email || '',
            playerRoles,
            customTags,
            customStringTags: Array.isArray((data as any).custom_string_tags) ? (data as any).custom_string_tags : [],
            createdAt: (data as any).createdat || '',
            seasons: [],
          };
          set((state) => ({ players: [...state.players, newPlayer] }));

          // Save previous seasons data by generating bulk matches and entries
          if (seasons && seasons.length > 0) {
            for (const season of seasons) {
              let seasonId: number;
              const seasonName = `Season ${season.year}`;

              // Always query DB directly to avoid stale cache causing duplicate seasons
              const { data: existingSeasons } = await supabase
                .from('season')
                .select('id')
                .eq('name', seasonName)
                .limit(1);

              if (existingSeasons && existingSeasons.length > 0) {
                seasonId = existingSeasons[0].id;
              } else {
                const { data: newSeason } = await supabase
                  .from('season')
                  .insert({
                    name: seasonName,
                    start_date: `${season.year}-01-01T00:00:00Z`,
                    is_current: false
                  })
                  .select('id')
                  .single();
                if (newSeason) {
                  seasonId = newSeason.id;
                  const fullNewSeason = {
                    id: newSeason.id,
                    name: seasonName,
                    start_date: `${season.year}-01-01T00:00:00Z`,
                    is_current: false
                  };
                  set(state => ({ seasons: [...state.seasons, fullNewSeason] }));
                } else {
                  continue;
                }
              }
              // Build match_entries directly from monthly stats — NO dummy matches created
              const entriesToInsert: any[] = [];
              for (const monthlyStat of season.monthlyStats || []) {
                const dates = monthlyStat.matchDates && monthlyStat.matchDates.length > 0
                  ? monthlyStat.matchDates
                  : [`${season.year}-${String(monthlyStat.month || 1).padStart(2, '0')}-01`];

                const totalMatches = monthlyStat.matches || 0;
                if (totalMatches === 0) continue;

                // Distribute goals across matches as evenly as possible
                const goalsPerMatch = Array(totalMatches).fill(0);
                for (let g = 0; g < (monthlyStat.goalsScored || 0); g++) {
                  goalsPerMatch[g % totalMatches]++;
                }
                const concededPerMatch = Array(totalMatches).fill(0);
                for (let g = 0; g < (monthlyStat.goalsConceded || 0); g++) {
                  concededPerMatch[g % totalMatches]++;
                }

                // Build result array: wins first, then losses, then draws
                const results: string[] = [
                  ...Array(monthlyStat.win || 0).fill('win'),
                  ...Array(monthlyStat.loss || 0).fill('loss'),
                  ...Array(monthlyStat.draw || 0).fill('draw'),
                ];

                // FIX: Distribute MOTM awards across matches (not just the first one).
                // motm is a COUNT (e.g. 3 means 3 MOTM awards that month), so we mark
                // the first N entries as motm=true, one per match, capped at totalMatches.
                const motmCount = Math.min(monthlyStat.motm || 0, totalMatches);
                const motmPerMatch = Array(totalMatches).fill(false);
                for (let m = 0; m < motmCount; m++) {
                  motmPerMatch[m] = true;
                }

                // FIX: Distribute clean sheets across matches (was always hardcoded false).
                // cleanSheet is a COUNT, so we mark the first N entries as cleansheet=true.
                const cleanSheetCount = Math.min(monthlyStat.cleanSheet || 0, totalMatches);
                const cleanSheetPerMatch = Array(totalMatches).fill(false);
                for (let c = 0; c < cleanSheetCount; c++) {
                  cleanSheetPerMatch[c] = true;
                }

                for (let i = 0; i < totalMatches; i++) {
                  entriesToInsert.push({
                    playerid: newPlayerId,
                    matchid: null,
                    goals: goalsPerMatch[i] || 0,
                    goalsconceded: concededPerMatch[i] || 0,
                    result: results[i] || 'draw',
                    hattricks: i === 0 && (monthlyStat.hattricks || 0) > 0 ? monthlyStat.hattricks : 0,
                    cleansheet: cleanSheetPerMatch[i],
                    motm: motmPerMatch[i],
                    notes: `Historical - Season ${season.year}`,
                    season_id: seasonId,
                    date: dates[i] || dates[0],
                  });
                }
              }
              if (entriesToInsert.length > 0) {
                const { error: entriesErr } = await supabase
                  .from('match_entries')
                  .insert(entriesToInsert);
                if (entriesErr) console.error('Failed to insert historical entries:', entriesErr);
              }

              // Run aggregation sync
              await updatePlayerSeasonStats(newPlayerId, seasonId);
            }

            // Sync the store state with database — force=true bypasses lazy guard after bulk insert
            await get().fetchMatchEntries(true);
            await get().fetchPlayerSeasonStats();
            // Fire milestones for all the historical data just imported
            const fired = await checkAndFireMilestones(newPlayerId);
            if (fired) await get().fetchNews();
          }

        }
      },
      
      updatePlayer: async (p) => {
        const playerData = mapPlayerToDb(p);
        const { data, error } = await supabase.from('players').update(playerData).eq('id', p.id).select('id, name, jerseynumber, email, custom_string_tags, createdat, profileimageurl, coverimageurl').single();
        if (error) {
          console.error('Error updating player:', error);
          alert('Failed to update player: ' + error.message);
          return;
        }
        if (data) {
          // Sync roles & tags via junction tables (replaces old ones)
          await syncPlayerRoles(p.id, p.playerRoles || []).catch(console.error);
          await syncPlayerTags(p.id, p.customTags || []).catch(console.error);

          // Issue 10 fix: build updated player from in-memory data — no re-fetch needed.
          const updated: Player = {
            id: p.id,
            name: data.name,
            profileImageUrl: (data as any).profileimageurl || '',
            coverImageUrl: (data as any).coverimageurl || '',
            jerseyNumber: (data as any).jerseynumber ?? undefined,
            email: data.email || '',
            playerRoles: p.playerRoles || [],
            customTags: p.customTags || [],
            customStringTags: Array.isArray((data as any).custom_string_tags) ? (data as any).custom_string_tags : [],
            createdAt: (data as any).createdat || '',
            seasons: [],
          };
          set((state) => ({ players: state.players.map(x => x.id === p.id ? updated : x) }));
        }
      },
      
      removePlayer: async (id) => {
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (!error) {
          const players = get().players.filter(x => x.id !== id);
          set({ 
            players, 
            matchEntries: get().matchEntries.filter((m: MatchEntry) => m.playerId !== id) 
          });
        } else {
          console.error('Error removing player:', error);
          alert('Failed to delete player: ' + error.message);
        }
      },
      
      fetchMatches: async () => {
        if (get().matches.length > 0) return;
        const { data, error } = await supabase.from('matches').select('id, season_id, hometeam, awayteam, homescore, awayscore, date, time, status, competition_id, competitions(name)');
        if (data) {
          set({ matches: data.map(mapMatchFromDb) });
        }
        if (error) console.error('Error fetching matches:', error);
      },
      setMatches: (matches) => set({ matches }),
      
      addMatch: async (m) => {
        // Resolve competition name to competition ID
        let competitionId: number | null = null;
        if (m.competition) {
          const existingComp = get().competitions.find(c => c.name.toLowerCase() === m.competition.toLowerCase());
          if (existingComp) {
            competitionId = existingComp.id;
          } else {
            const { data: newComp } = await supabase
              .from('competitions')
              .insert({ name: m.competition })
              .select('id')
              .single();
            if (newComp) {
              competitionId = newComp.id;
              const fullNewComp = {
                id: newComp.id,
                name: m.competition,
                isActive: true,
                createdAt: new Date().toISOString()
              };
              set(state => ({ competitions: [...state.competitions, fullNewComp] }));
            }
          }
        }

        // Auto-create/resolve season based on match date
        const year = m.date ? m.date.split('-')[0] : new Date().getFullYear().toString();
        const seasonName = `Season ${year}`;
        let seasonId: number;

        const existingSeason = get().seasons.find(s => s.name === seasonName);
        if (existingSeason) {
          seasonId = existingSeason.id;
        } else {
          const { data: newSeason, error: seasonError } = await supabase
            .from('season')
            .insert({
              name: seasonName,
              start_date: `${year}-01-01T00:00:00Z`,
              is_current: false
            })
            .select('id, name, is_current, start_date')
            .single();

          if (seasonError || !newSeason) {
            console.error('Failed to auto-create season:', seasonError);
            alert('Failed to save match: ' + (seasonError?.message || 'Season error'));
            return;
          }

          seasonId = newSeason.id;
          set(state => ({ seasons: [...state.seasons, newSeason] }));
        }

        const matchData = mapMatchToDb({
          ...m,
          seasonId,
          competitionId,
        });

        const { data, error } = await supabase.from('matches').insert([matchData]).select('id, season_id, hometeam, awayteam, homescore, awayscore, date, time, status, competition_id, competitions(name)').single();
        if (data) {
          set((state) => ({ matches: [...state.matches, mapMatchFromDb(data)] }));
          return data.id;
        }
        if (error) {
          console.error('Error adding match:', error);
          alert('Failed to save match: ' + error.message);
        }
      },
      
      updateMatch: async (m) => {
        let competitionId: number | null = null;
        if (m.competition) {
          const existingComp = get().competitions.find(c => c.name.toLowerCase() === m.competition.toLowerCase());
          if (existingComp) {
            competitionId = existingComp.id;
          } else {
            const { data: newComp } = await supabase
              .from('competitions')
              .insert({ name: m.competition })
              .select('id')
              .single();
            if (newComp) {
              competitionId = newComp.id;
              const fullNewComp = {
                id: newComp.id,
                name: m.competition,
                isActive: true,
                createdAt: new Date().toISOString()
              };
              set(state => ({ competitions: [...state.competitions, fullNewComp] }));
            }
          }
        }

        // Auto-create/resolve season based on match date
        const year = m.date ? m.date.split('-')[0] : new Date().getFullYear().toString();
        const seasonName = `Season ${year}`;
        let seasonId: number;

        const existingSeason = get().seasons.find(s => s.name === seasonName);
        if (existingSeason) {
          seasonId = existingSeason.id;
        } else {
          const { data: newSeason, error: seasonError } = await supabase
            .from('season')
            .insert({
              name: seasonName,
              start_date: `${year}-01-01T00:00:00Z`,
              is_current: false
            })
            .select('id, name, is_current, start_date')
            .single();

          if (seasonError || !newSeason) {
            console.error('Failed to auto-create season for update:', seasonError);
            alert('Failed to update match: ' + (seasonError?.message || 'Season error'));
            return;
          }

          seasonId = newSeason.id;
          set(state => ({ seasons: [...state.seasons, newSeason] }));
        }

        const matchData = mapMatchToDb({
          ...m,
          seasonId,
          competitionId,
        });

        const { data, error } = await supabase.from('matches').update(matchData).eq('id', m.id).select('id, season_id, hometeam, awayteam, homescore, awayscore, date, time, status, competition_id, competitions(name)').single();
        if (data) {
          set((state) => ({ matches: state.matches.map(x => x.id === m.id ? mapMatchFromDb(data) : x) }));
        }
        if (error) {
          console.error('Error updating match:', error);
          alert('Failed to update match: ' + error.message);
        }
      },
      
      removeMatch: async (id) => {
        const { error } = await supabase.from('matches').delete().eq('id', id);
        if (!error) set((state) => ({ matches: state.matches.filter(x => x.id !== id) }));
        else {
          console.error('Error removing match:', error);
          alert('Failed to delete match: ' + error.message);
        }
      },
      
      fetchMatchEntries: async (force = false) => {
        // Issue 12: lazy-load guard — only fetch once. Pass force=true to bypass after bulk inserts.
        if (!force && get().matchEntriesLoaded) return;
        // Only fetch the most recent 500 entries to prevent memory crashes.
        // Full data is accessed via paginated queries or RPC functions.
        // Issue 5 fix: project only columns mapMatchEntryFromDb reads
        const { data, error, count } = await supabase
          .from('match_entries')
          .select('id, playerid, matchid, goals, goalsconceded, result, hattricks, cleansheet, motm, date, time, notes, season_id', { count: 'exact' })
          .order('date', { ascending: false })
          .limit(500);
          
        if (data) {
          set({ 
            matchEntries: data.map(mapMatchEntryFromDb),
            globalMatchEntriesCount: count ?? 0,
            matchEntriesLoaded: true,
          });
        }
        if (error) console.error('Error fetching match entries:', error);
      },
      setMatchEntries: (matchEntries) => set({ matchEntries }),
      addMatchEntry: async (e) => {
        let matchId = e.matchId || null;
        let seasonId: number;
        let entryDate = e.date;

        if (matchId) {
          const associatedMatch = get().matches.find(m => m.id === matchId);
          if (associatedMatch && associatedMatch.seasonId) {
            seasonId = associatedMatch.seasonId;
            entryDate = associatedMatch.date;
          } else {
            alert('Cannot save match entry: no season associated.');
            return;
          }
        } else {
          // If no matchId (historical data directly into match_entries)
          // Ensure season is created/exists for the year
          const year = e.date ? e.date.split('-')[0] : new Date().getFullYear().toString();
          const seasonName = `Season ${year}`;
          const existingSeason = get().seasons.find(s => s.name === seasonName);
          if (existingSeason) {
            seasonId = existingSeason.id;
          } else {
            const { data: newSeason, error: seasonError } = await supabase
              .from('season')
              .insert({
                name: seasonName,
                start_date: `${year}-01-01T00:00:00Z`,
                is_current: false
              })
              .select('id, name, is_current, start_date')
              .single();

            if (seasonError || !newSeason) {
              alert('Failed to auto-create season for entry: ' + seasonError?.message);
              return;
            }
            seasonId = newSeason.id;
            set(state => ({ seasons: [...state.seasons, newSeason] }));
          }
        }

        const entryData = mapMatchEntryToDb({
          ...e,
          matchId,
          seasonId,
          date: entryDate || new Date().toISOString().split('T')[0]
        });

        const { data, error } = await supabase.from('match_entries').insert([entryData]).select('id, playerid, matchid, goals, goalsconceded, result, hattricks, cleansheet, motm, date, time, notes, season_id').single();
        if (data) {
          const newEntry = mapMatchEntryFromDb(data);
          // FIX 2: Optimistic insert already keeps local state correct — remove the
          // full fetchMatchEntries() + fetchPlayerSeasonStats() double-refetch.
          set((state) => ({ matchEntries: [...state.matchEntries, newEntry] }));
          // Auto-milestone check
          const fired = await checkAndFireMilestones(newEntry.playerId);
          if (fired) await get().fetchNews();
        }
        if (error) {
          console.error('Error adding match entry:', error);
          alert('Failed to save entry: ' + error.message);
        }
      },
      
      updateMatchEntry: async (e) => {
        // Use the entry's own seasonId — never fall back to an arbitrary season
        const seasonId = e.seasonId;
        if (!seasonId) {
          console.error('updateMatchEntry: entry has no seasonId, aborting stats update', e);
          return;
        }
        const entryData = mapMatchEntryToDb({
          ...e,
          seasonId,
        });
        
        const { data, error } = await supabase.from('match_entries').update(entryData).eq('id', e.id).select('id, playerid, matchid, goals, goalsconceded, result, hattricks, cleansheet, motm, date, time, notes, season_id').single();
        if (data) {
          const updatedEntry = mapMatchEntryFromDb(data);
          // FIX 2: Optimistic update already keeps local state correct — remove the
          // full fetchMatchEntries() + fetchPlayerSeasonStats() double-refetch.
          set((state) => ({ matchEntries: state.matchEntries.map(x => x.id === e.id ? updatedEntry : x) }));
          // Auto-milestone check
          const fired = await checkAndFireMilestones(updatedEntry.playerId);
          if (fired) await get().fetchNews();
        }
        if (error) console.error('Error updating match entry:', error);
      },
      
      removeMatchEntry: async (id) => {
        // Try local cache first (entry is in the 500-row window).
        // Fall back to a targeted DB fetch for entries outside the window
        // (e.g. deleted from the paginated MatchEntries page) so that
        // fetchPlayerSeasonStats and checkAndFireMilestones always run.
        let entry = get().matchEntries.find(x => x.id === id) as any;
        if (!entry) {
          const { data: fallback } = await supabase
            .from('match_entries')
            .select('playerid, season_id')
            .eq('id', id)
            .single();
          if (fallback) entry = { playerId: fallback.playerid, seasonId: fallback.season_id };
        }

        const { error } = await supabase.from('match_entries').delete().eq('id', id);
        if (!error) {
          set((state) => ({ matchEntries: state.matchEntries.filter(x => x.id !== id) }));
          if (entry && entry.seasonId) {
            // Database trigger handles stats sync, just fetch the updated stats
            await get().fetchPlayerSeasonStats();
            // Auto-milestone check
            const fired = await checkAndFireMilestones(entry.playerId);
            if (fired) await get().fetchNews();
          }
        }
        else console.error('Error removing match entry:', error);
      },
      
      fetchNews: async () => {
        if (get().news.length > 0) return;
        // Issue 8 fix: limit to 200 most-recent articles — milestone automation can grow this table large
        const { data, error } = await supabase
          .from('news')
          .select('id, title, content, author, category, hot, date, image')
          .order('date', { ascending: false })
          .limit(200);
        if (data) set({ news: data as NewsArticle[] });
        if (error) console.error('Error fetching news:', error);
      },
      setNews: (news) => set({ news }),
      addNews: async (n) => {
        const { id, ...newsData } = n;
        const { data, error } = await supabase.from('news').insert([newsData]).select('id, title, content, author, category, hot, date, image').single();
        if (data) {
          set((state) => ({ news: [...state.news, data as NewsArticle] }));
        }
        if (error) {
          console.error('Error adding news:', error);
          alert('Failed to add news: ' + error.message);
        }
      },
      updateNews: async (n) => {
        const { id, ...newsData } = n;
        const { data, error } = await supabase.from('news').update(newsData).eq('id', id).select('id, title, content, author, category, hot, date, image').single();
        if (data) {
          set((state) => ({ news: state.news.map(x => x.id === id ? (data as NewsArticle) : x) }));
        }
        if (error) {
          console.error('Error updating news:', error);
          alert('Failed to update news: ' + error.message);
        }
      },
      removeNews: async (id) => {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (!error) {
          set((state) => ({ news: state.news.filter(x => x.id !== id) }));
        } else {
          console.error('Error removing news:', error);
          alert('Failed to delete news: ' + error.message);
        }
      },

      fetchSeasons: async () => {
        if (get().seasons.length > 0) return;
        const { data, error } = await supabase.from('season').select('id, name, is_current, start_date').order('name', { ascending: true });
        if (data) {
          set({ seasons: data as SeasonDb[] });

          // Defensive initialization: If no seasons exist, create a default current season
          if (data.length === 0) {
            const defaultSeasonName = 'Season 1';
            const { data: newSeason } = await supabase
              .from('season')
              .insert({
                name: defaultSeasonName,
                is_current: true,
                start_date: new Date().toISOString()
              })
              .select('id, name, is_current, start_date')
              .single();
            if (newSeason) {
              set({ seasons: [newSeason as SeasonDb] });
            }
          }
        }
        if (error) console.error('Error fetching seasons:', error);
      },

      addSeason: async (name: string) => {
        const { data, error } = await supabase
          .from('season')
          .insert({
            name,
            start_date: new Date().toISOString(),
            is_current: false
          })
          .select('id, name, is_current, start_date')
          .single();

        if (data) {
          const newSeason = data as SeasonDb;
          set((state) => ({ seasons: [...state.seasons, newSeason].sort((a, b) => a.name.localeCompare(b.name)) }));
          return newSeason;
        }
        if (error) {
          console.error('Error adding season:', error);
          alert('Failed to create season: ' + error.message);
        }
      },

      setCurrentSeason: async (id: number) => {
        // Issue 11: single atomic RPC instead of two blanket-update queries.
        // The DB function flips is_current=false for all rows, then is_current=true for the target.
        const { error } = await supabase.rpc('set_current_season', { p_season_id: id });
        if (error) {
          console.error('Error setting current season:', error);
          return;
        }
        // Update local state to match — no extra select needed
        set((state) => ({
          seasons: state.seasons.map(s => s.id === id
            ? { ...s, is_current: true }
            : { ...s, is_current: false }
          )
        }));
      },

          repairPlayerSeasonStat: async (statId, patch) => {
        const { error } = await supabase
          .from('player_season_stats')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', statId);
        if (error) {
          console.error('Error repairing player season stat:', error);
          throw error;
        }
        // Refresh stats from DB
        await get().fetchPlayerSeasonStats();
      },

      repairPlayerMonthlyStats: async (playerId, seasonId, year, month, target) => {
        const mm = String(month).padStart(2, '0');
        const startDate = `${year}-${mm}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;

        const { data: allEntries, error: fetchErr } = await supabase
          .from('match_entries')
          .select('*')
          .eq('playerid', playerId)
          .eq('season_id', seasonId)
          .gte('date', startDate)
          .lte('date', endDate);

        if (fetchErr) {
          console.error('Error fetching match entries for repair:', fetchErr);
          throw fetchErr;
        }

        const entries = allEntries || [];
        const realEntries = entries.filter(e => e.matchid !== null);
        const histEntries = entries.filter(e => e.matchid === null);

        // Calculate real match stats
        const realApps = realEntries.length;
        const realWins = realEntries.filter(e => e.result === 'win').length;
        const realDraws = realEntries.filter(e => e.result === 'draw').length;
        const realLosses = realEntries.filter(e => e.result === 'loss').length;
        const realGoals = realEntries.reduce((sum, e) => sum + (e.goals || 0), 0);
        const realConceded = realEntries.reduce((sum, e) => sum + (e.goalsconceded || 0), 0);
        const realMOTM = realEntries.filter(e => e.motm).length;
        const realCS = realEntries.filter(e => e.cleansheet).length;
        const realHattricks = realEntries.reduce((sum, e) => sum + (e.hattricks || 0), 0);

        // Validation check
        if (target.matches < realApps) {
          throw new Error(`Target matches (${target.matches}) cannot be less than actual matches played (${realApps}).`);
        }

        // Calculate historical difference needed
        const histApps = target.matches - realApps;
        const histWins = Math.max(0, target.win - realWins);
        const histDraws = Math.max(0, target.draw - realDraws);
        const histLosses = Math.max(0, target.loss - realLosses);
        const histGoals = Math.max(0, target.goalsScored - realGoals);
        const histConceded = Math.max(0, target.goalsConceded - realConceded);
        const histMOTM = Math.max(0, target.motm - realMOTM);
        const histCS = Math.max(0, target.cleanSheet - realCS);
        const histHattricks = Math.max(0, target.hattricks - realHattricks);

        // 2. Delete all existing historical entries for this month/season/player
        if (histEntries.length > 0) {
          const histIds = histEntries.map(e => e.id);
          const { error: delErr } = await supabase
            .from('match_entries')
            .delete()
            .in('id', histIds);
          if (delErr) {
            console.error('Error deleting historical match entries:', delErr);
            throw delErr;
          }
        }

        // 3. Insert new historical match entries if needed
        if (histApps > 0) {
          const picked: number[] = [];
          const step = Math.max(1, Math.floor(lastDay / histApps));
          for (let i = 0; i < histApps; i++) {
            const day = Math.min(lastDay, 1 + i * step + (i % 2));
            picked.push(day);
          }
          const dates = picked.sort((a, b) => a - b).map(day => `${year}-${mm}-${String(day).padStart(2, '0')}`);

          const goalsPerMatch = Array(histApps).fill(0);
          for (let g = 0; g < histGoals; g++) {
            goalsPerMatch[g % histApps]++;
          }
          const concededPerMatch = Array(histApps).fill(0);
          for (let g = 0; g < histConceded; g++) {
            concededPerMatch[g % histApps]++;
          }

          const results: string[] = [
            ...Array(histWins).fill('win'),
            ...Array(histLosses).fill('loss'),
            ...Array(histDraws).fill('draw'),
          ];

          const motmCount = Math.min(histMOTM, histApps);
          const motmPerMatch = Array(histApps).fill(false);
          for (let m = 0; m < motmCount; m++) {
            motmPerMatch[m] = true;
          }

          const cleanSheetCount = Math.min(histCS, histApps);
          const cleanSheetPerMatch = Array(histApps).fill(false);
          for (let c = 0; c < cleanSheetCount; c++) {
            cleanSheetPerMatch[c] = true;
          }

          const entriesToInsert = [];
          for (let i = 0; i < histApps; i++) {
            entriesToInsert.push({
              playerid: playerId,
              matchid: null,
              goals: goalsPerMatch[i] || 0,
              goalsconceded: concededPerMatch[i] || 0,
              result: results[i] || 'draw',
              hattricks: i === 0 && histHattricks > 0 ? histHattricks : 0,
              cleansheet: cleanSheetPerMatch[i],
              motm: motmPerMatch[i],
              notes: `Historical - Season ${year}`,
              season_id: seasonId,
              date: dates[i] || dates[0],
            });
          }

          const { error: insErr } = await supabase
            .from('match_entries')
            .insert(entriesToInsert);
          if (insErr) {
            console.error('Error inserting historical match entries:', insErr);
            throw insErr;
          }
        }

        // 4. Update the season aggregation row
        await updatePlayerSeasonStats(playerId, seasonId);

        // 5. Refresh local store state — force=true bypasses lazy guard after bulk repair
        await get().fetchMatchEntries(true);
        await get().fetchPlayerSeasonStats();
        const fired = await checkAndFireMilestones(playerId);
        if (fired) await get().fetchNews();
      },

      recheckMilestones: async (playerId) => {
        // Step 1: Wipe existing milestone_log rows for this player so we can re-evaluate from scratch.
        // This is safe — the log is only used to prevent duplicate news articles.
        const { error: delErr } = await supabase
          .from('milestone_log')
          .delete()
          .eq('player_id', playerId);
        if (delErr) console.error('recheckMilestones: failed to clear milestone_log:', delErr);

        // Step 2: Re-scan all match_entries and fire any milestones not yet in news.
        const fired = await checkAndFireMilestones(playerId);
        if (fired) await get().fetchNews();
        return { fired };
      },

      fetchPlayerSeasonStats: async () => {
        if (get().playerSeasonStats.length > 0) return;
        const { data, error } = await supabase
          .from('player_season_stats')
          .select('id, player_id, season_id, appearances, goals, cleansheets, hattricks, motmcount, wins, draws, losses, goalsconceded, season:season_id(name)');
        if (data) {
          set({
            playerSeasonStats: data.map(item => {
              return {
                id: item.id,
                playerId: item.player_id,
                seasonId: item.season_id,
                seasonName: (item.season as any)?.name || `Season ${item.season_id}`,
                appearances: item.appearances || 0,
                goals: item.goals || 0,
                cleansheets: item.cleansheets || 0,
                hattricks: item.hattricks || 0,
                motmCount: item.motmcount || 0,
                wins: item.wins || 0,
                draws: item.draws || 0,
                losses: item.losses || 0,
                goalsConceded: item.goalsconceded || 0,
              };
            })
          });
        }
        if (error) console.error('Error fetching player season stats:', error);
      },

      fetchCompetitions: async () => {
        if (get().competitions.length > 0) return;
        const { data, error } = await supabase.from('competitions').select('id, name, is_active, created_at');
        if (data) {
          set({
            competitions: data.map(c => ({
              id: c.id,
              name: c.name,
              isActive: c.is_active,
              createdAt: c.created_at
            }))
          });
        }
        if (error) console.error('Error fetching competitions:', error);
      },

      fetchAvailableRoles: async () => {
        if (get().availableRoles.length > 0) return;
        const { data, error } = await supabase
          .from('player_role')
          .select('id, name, status, created_at')
          .eq('status', true)
          .order('name', { ascending: true });
        if (data) {
          set({
            availableRoles: data.map(r => ({
              id: r.id,
              name: r.name,
              status: r.status,
              createdAt: r.created_at,
            }))
          });
        }
        if (error) console.error('Error fetching player roles:', error);
      },

      fetchAvailableTags: async () => {
        if (get().availableTags.length > 0) return;
        const { data, error } = await supabase
          .from('custom_tags')
          .select('id, name, status, created_at')
          .eq('status', true)
          .order('name', { ascending: true });
        if (data) {
          set({
            availableTags: data.map(t => ({
              id: t.id,
              name: t.name,
              status: t.status,
              createdAt: t.created_at,
            }))
          });
        }
        if (error) console.error('Error fetching custom tags:', error);
      },


      fetchHallOfFame: async () => {
        if (get().hallOfFame.length > 0) return;
        const { data, error } = await supabase.from('hall_of_frame').select('id, created_at, player_id, category, season_text, sub_title, descriptions');
        if (data) {
          set({ hallOfFame: data.map(mapHallOfFameFromDb) });
        }
        if (error) console.error('Error fetching Hall of Fame:', error);
      },

      addHallOfFameEntry: async (entry) => {
        const dbData = mapHallOfFameToDb(entry);
        const { data, error } = await supabase.from('hall_of_frame').insert([dbData]).select('id, created_at, player_id, category, season_text, sub_title, descriptions').single();
        if (data) {
          set((state) => ({ hallOfFame: [...state.hallOfFame, mapHallOfFameFromDb(data)] }));
        }
        if (error) {
          console.error('Error adding Hall of Fame entry:', error);
          alert('Failed to add entry: ' + error.message);
        }
      },

      updateHallOfFameEntry: async (entry) => {
        const dbData = mapHallOfFameToDb(entry);
        const { data, error } = await supabase.from('hall_of_frame').update(dbData).eq('id', entry.id).select('id, created_at, player_id, category, season_text, sub_title, descriptions').single();
        if (data) {
          set((state) => ({ hallOfFame: state.hallOfFame.map(x => x.id === entry.id ? mapHallOfFameFromDb(data) : x) }));
        }
        if (error) {
          console.error('Error updating Hall of Fame entry:', error);
          alert('Failed to update entry: ' + error.message);
        }
      },

      removeHallOfFameEntry: async (id) => {
        const { error } = await supabase.from('hall_of_frame').delete().eq('id', id);
        if (!error) {
          set((state) => ({ hallOfFame: state.hallOfFame.filter(x => x.id !== id) }));
        } else {
          console.error('Error removing Hall of Fame entry:', error);
          alert('Failed to delete entry: ' + error.message);
        }
      },

      fetchClubRules: async () => {
        if (get().clubRules.length > 0) return;
        const { data, error } = await supabase.from('club_rules').select('id, title, subtitle, description, created_at').order('created_at', { ascending: false });
        if (data) set({ clubRules: data.map(mapClubRuleFromDb) });
        if (error) console.error('Error fetching club rules:', error);
      },
      addClubRule: async (rule) => {
        const dbData = mapClubRuleToDb(rule);
        const { data, error } = await supabase.from('club_rules').insert([dbData]).select('id, title, subtitle, description, created_at').single();
        if (data) {
          set((state) => ({ clubRules: [mapClubRuleFromDb(data), ...state.clubRules] }));
        }
        if (error) {
          console.error('Error adding club rule:', error);
          alert('Failed to add rule: ' + error.message);
        }
      },
      updateClubRule: async (rule) => {
        const dbData = mapClubRuleToDb(rule);
        const { data, error } = await supabase.from('club_rules').update(dbData).eq('id', rule.id).select('id, title, subtitle, description, created_at').single();
        if (data) {
          set((state) => ({ clubRules: state.clubRules.map(x => x.id === rule.id ? mapClubRuleFromDb(data) : x) }));
        }
        if (error) {
          console.error('Error updating club rule:', error);
          alert('Failed to update rule: ' + error.message);
        }
      },
      removeClubRule: async (id) => {
        const { error } = await supabase.from('club_rules').delete().eq('id', id);
        if (!error) {
          set((state) => ({ clubRules: state.clubRules.filter(x => x.id !== id) }));
        } else {
          console.error('Error removing club rule:', error);
          alert('Failed to delete rule: ' + error.message);
        }
      },

      fetchClubRanks: async () => {
        if (get().clubRanks.length > 0) return;
        const { data, error } = await supabase.from('club_ranks').select('*').order('created_at', { ascending: false });
        if (data) set({ clubRanks: data.map(mapClubRankFromDb) });
        if (error) console.error('Error fetching club ranks:', error);
      },
      addClubRank: async (rank) => {
        const dbData = mapClubRankToDb(rank);
        const { data, error } = await supabase.from('club_ranks').insert([dbData]).select('*').single();
        if (data) {
          set((state) => ({ clubRanks: [mapClubRankFromDb(data), ...state.clubRanks] }));
        }
        if (error) {
          console.error('Error adding club rank:', error);
          alert('Failed to add rank: ' + error.message);
        }
      },
      updateClubRank: async (rank) => {
        const dbData = mapClubRankToDb(rank);
        const { data, error } = await supabase.from('club_ranks').update(dbData).eq('id', rank.id).select('*').single();
        if (data) {
          set((state) => ({ clubRanks: state.clubRanks.map(x => x.id === rank.id ? mapClubRankFromDb(data) : x) }));
        }
        if (error) {
          console.error('Error updating club rank:', error);
          alert('Failed to update rank: ' + error.message);
        }
      },
      removeClubRank: async (id) => {
        const { error } = await supabase.from('club_ranks').delete().eq('id', id);
        if (!error) {
          set((state) => ({ clubRanks: state.clubRanks.filter(x => x.id !== id) }));
        } else {
          console.error('Error removing club rank:', error);
          alert('Failed to delete rank: ' + error.message);
        }
      },

      fetchClubAchievements: async () => {
        const { data, error } = await supabase.from('club_achievements').select('id, image_url, title, subtitle, description, created_at').order('created_at', { ascending: false });
        if (data) set({ clubAchievements: data.map(mapClubAchievementFromDb) });
        if (error) console.error('Error fetching club achievements:', error);
      },
      addClubAchievement: async (achievement) => {
        const dbData = mapClubAchievementToDb(achievement);
        const { data, error } = await supabase.from('club_achievements').insert([dbData]).select('id, image_url, title, subtitle, description, created_at').single();
        if (data) {
          set((state) => ({ clubAchievements: [mapClubAchievementFromDb(data), ...state.clubAchievements] }));
        }
        if (error) {
          console.error('Error adding club achievement:', error);
          alert('Failed to add achievement: ' + error.message);
        }
      },
      updateClubAchievement: async (achievement) => {
        const dbData = mapClubAchievementToDb(achievement);
        const { data, error } = await supabase.from('club_achievements').update(dbData).eq('id', achievement.id).select('id, image_url, title, subtitle, description, created_at').single();
        if (data) {
          set((state) => ({ clubAchievements: state.clubAchievements.map(x => x.id === achievement.id ? mapClubAchievementFromDb(data) : x) }));
        }
        if (error) {
          console.error('Error updating club achievement:', error);
          alert('Failed to update achievement: ' + error.message);
        }
      },
      removeClubAchievement: async (id) => {
        const { error } = await supabase.from('club_achievements').delete().eq('id', id);
        if (!error) {
          set((state) => ({ clubAchievements: state.clubAchievements.filter(x => x.id !== id) }));
        } else {
          console.error('Error removing club achievement:', error);
          alert('Failed to delete achievement: ' + error.message);
        }
      },
    }),
    { enabled: process.env.NODE_ENV !== 'production' }
  )
);

