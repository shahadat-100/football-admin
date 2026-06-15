import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Player, SeasonDb, PlayerSeasonStat } from '@/features/players/types';
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

// ── Database Mapping Helpers ─────────────────────────────────────────

export const mapPlayerFromDb = (p: any): Player => ({
  id: p.id,
  name: p.name,
  profileImageUrl: p.profileimageurl || '',
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
  competition: m.competitions?.name || 'Premier League',
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

  // Server-side paginated entries (for MatchEntries page)
  paginatedMatchEntries: MatchEntry[];
  totalMatchEntriesCount: number;
  isPaginatedEntriesLoading: boolean;
  
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
  addMatch: (m: Match) => Promise<void>;
  updateMatch: (m: Match) => Promise<void>;
  removeMatch: (id: string) => Promise<void>;
  
  fetchMatchEntries: () => Promise<void>;
  setMatchEntries: (e: MatchEntry[]) => void;
  addMatchEntry: (e: MatchEntry) => Promise<void>;
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
  fetchCompetitions: () => Promise<void>;
  fetchAvailableRoles: () => Promise<void>;
  fetchAvailableTags: () => Promise<void>;

  fetchHallOfFame: () => Promise<void>;
  addHallOfFameEntry: (entry: Omit<HallOfFameEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateHallOfFameEntry: (entry: HallOfFameEntry) => Promise<void>;
  removeHallOfFameEntry: (id: number) => Promise<void>;
}

// ── Upsert Roles & Tags to Junction Tables ───────────────────────────

// Sync player roles via junction table — roles are pre-defined, just look up by name
const syncPlayerRoles = async (playerId: string, roles: string[]) => {
  // Delete existing role links for this player
  await supabase.from('player_player_roles').delete().eq('player_id', playerId);
  if (!roles || roles.length === 0) return;

  for (const name of roles) {
    if (!name.trim()) continue;
    // Just SELECT the existing role by name (pre-defined, no insert needed)
    const { data: roleData } = await supabase
      .from('player_role')
      .select('id')
      .eq('name', name.trim())
      .single();
    if (roleData?.id) {
      await supabase
        .from('player_player_roles')
        .insert({ player_id: playerId, role_id: roleData.id });
    }
  }
};

// Sync player tags via junction table — tags are pre-defined, just look up by name
const syncPlayerTags = async (playerId: string, tags: string[]) => {
  // Delete existing tag links for this player
  await supabase.from('player_custom_tags').delete().eq('player_id', playerId);
  if (!tags || tags.length === 0) return;

  for (const name of tags) {
    if (!name.trim()) continue;
    // Just SELECT the existing tag by name (pre-defined, no insert needed)
    const { data: tagData } = await supabase
      .from('custom_tags')
      .select('id')
      .eq('name', name.trim())
      .single();
    if (tagData?.id) {
      await supabase
        .from('player_custom_tags')
        .insert({ player_id: playerId, tag_id: tagData.id });
    }
  }
};

// ── Background Aggregation Sync Helper ───────────────────────────────


const updatePlayerSeasonStats = async (playerId: string, seasonId: number) => {
  const { data: entries, error } = await supabase
    .from('match_entries')
    .select('*, matches(status, date)')
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
    const { data: player } = await supabase.from('players').select('name').eq('id', playerId).single();
    if (!player) return false;
    const playerName = player.name;

    const { data: statsRows } = await supabase
      .from('player_season_stats').select('*').eq('player_id', playerId);
    if (!statsRows) return false;

    const { data: entries } = await supabase
      .from('match_entries')
      .select('result, goals, cleansheet, hattricks, motm, date, matches(date)')
      .eq('playerid', playerId);

    const sorted = ((entries ?? []) as any[])
      .map(e => ({ ...e, date: e.date || e.matches?.date }))
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
      
      if (e.result === 'win') { rWins++; currentWinStreak++; currentUnbeatenStreak++; }
      else if (e.result === 'draw') { currentWinStreak = 0; currentUnbeatenStreak++; }
      else { currentWinStreak = 0; currentUnbeatenStreak = 0; }

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

      await supabase.from('news').insert({
        title:    _milestoneTitle(playerName, key, t, emoji),
        content:  _milestoneContent(playerName, key, t),
        author:   'Club Records',
        category: 'Player',
        hot:      true,
        date:     date, // EXACT date it happened
      });
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

      paginatedMatchEntries: [],
      totalMatchEntriesCount: 0,
      isPaginatedEntriesLoading: false,
      
      isInitialized: false,
      initializeData: async () => {
        // Smart caching: skip if already initialized
        if (get().isInitialized) return;
        const store = get();
        // Step 1: Fetch seasons first — this wakes up Supabase free tier cold start.
        // All subsequent requests reuse the warm connection and are fast.
        await store.fetchSeasons();
        // Step 2: Fetch everything else in parallel on the warm connection.
        await Promise.all([
          (async () => { console.time('fetchPlayers'); await store.fetchPlayers(); console.timeEnd('fetchPlayers'); })(),
          (async () => { console.time('fetchMatches'); await store.fetchMatches(); console.timeEnd('fetchMatches'); })(),
          (async () => { console.time('fetchMatchEntries'); await store.fetchMatchEntries(); console.timeEnd('fetchMatchEntries'); })(),
          (async () => { console.time('fetchPlayerSeasonStats'); await store.fetchPlayerSeasonStats(); console.timeEnd('fetchPlayerSeasonStats'); })()
        ]);
        set({ isInitialized: true });
      },

      fetchPaginatedMatchEntries: async (page, pageSize, searchPlayerIds) => {
        set({ isPaginatedEntriesLoading: true });
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        let query = supabase
          .from('match_entries')
          .select('*', { count: 'exact' })
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
        try {
          // Fetch all related tables in parallel to avoid sequential waterfall.
          // We select specific columns but include profileimageurl again. 
          // Future uploads are resized so they won't bloat the payload.
          const [playersRes, junctionRolesRes, rolesRes, junctionTagsRes, tagsRes] = await Promise.all([
            supabase.from('players').select('id, name, jerseynumber, email, custom_string_tags, createdat, profileimageurl'),
            supabase.from('player_player_roles').select('*'),
            supabase.from('player_role').select('*'),
            supabase.from('player_custom_tags').select('*'),
            supabase.from('custom_tags').select('*')
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
        
        const { data, error } = await supabase.from('players').insert([playerData]).select().single();
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

          // Re-fetch this player with joined roles & tags to build correct state
          const { data: fullPlayer } = await supabase
            .from('players')
            .select(`
              *,
              player_player_roles(role_id, player_role(name)),
              player_custom_tags(tag_id, custom_tags(name))
            `)
            .eq('id', newPlayerId)
            .single();

          const newPlayer = mapPlayerFromDb(fullPlayer ?? data);
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
                  .select()
                  .single();
                if (newSeason) {
                  seasonId = newSeason.id;
                  set(state => ({ seasons: [...state.seasons, newSeason] }));
                } else {
                  continue;
                }
              }

              // Build match_entries directly from weekly stats — NO dummy matches created
              const entriesToInsert: any[] = [];
              for (const monthlyStat of season.monthlyStats || []) {
                for (const weeklyStat of monthlyStat.weeklyStats || []) {
                  const dates = weeklyStat.matchDates && weeklyStat.matchDates.length > 0
                    ? weeklyStat.matchDates
                    : [`${season.year}-${String(monthlyStat.month || 1).padStart(2, '0')}-01`];

                  const totalMatches = weeklyStat.matches || 0;
                  if (totalMatches === 0) continue;

                  // Distribute goals across matches as evenly as possible
                  const goalsPerMatch = Array(totalMatches).fill(0);
                  for (let g = 0; g < (weeklyStat.goalsScored || 0); g++) {
                    goalsPerMatch[g % totalMatches]++;
                  }
                  const concededPerMatch = Array(totalMatches).fill(0);
                  for (let g = 0; g < (weeklyStat.goalsConceded || 0); g++) {
                    concededPerMatch[g % totalMatches]++;
                  }

                  // Build result array: wins first, then losses, then draws
                  const results: string[] = [
                    ...Array(weeklyStat.win || 0).fill('win'),
                    ...Array(weeklyStat.loss || 0).fill('loss'),
                    ...Array(weeklyStat.draw || 0).fill('draw'),
                  ];

                  for (let i = 0; i < totalMatches; i++) {
                    entriesToInsert.push({
                      playerid: newPlayerId,
                      matchid: null,
                      goals: goalsPerMatch[i] || 0,
                      goalsconceded: concededPerMatch[i] || 0,
                      result: results[i] || 'draw',
                      hattricks: 0,
                      cleansheet: false,
                      motm: i === 0 && (weeklyStat.motm || 0) > 0,
                      notes: `Historical - Season ${season.year}`,
                      season_id: seasonId,
                      date: dates[i] || dates[0],
                    });
                  }
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

            // Sync the store state with database
            await get().fetchMatchEntries();
            await get().fetchPlayerSeasonStats();
          }

        }
      },
      
      updatePlayer: async (p) => {
        const playerData = mapPlayerToDb(p);
        const { data, error } = await supabase.from('players').update(playerData).eq('id', p.id).select().single();
        if (error) {
          console.error('Error updating player:', error);
          alert('Failed to update player: ' + error.message);
          return;
        }
        if (data) {
          // Sync roles & tags via junction tables (replaces old ones)
          await syncPlayerRoles(p.id, p.playerRoles || []).catch(console.error);
          await syncPlayerTags(p.id, p.customTags || []).catch(console.error);

          // Re-fetch this player with joined roles & tags
          const { data: fullPlayer } = await supabase
            .from('players')
            .select(`
              *,
              player_player_roles(role_id, player_role(name)),
              player_custom_tags(tag_id, custom_tags(name))
            `)
            .eq('id', p.id)
            .single();

          const updated = mapPlayerFromDb(fullPlayer ?? data);
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
        const { data, error } = await supabase.from('matches').select('*, competitions(name)');
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
              .select()
              .single();
            if (newComp) {
              competitionId = newComp.id;
              set(state => ({ competitions: [...state.competitions, newComp] }));
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
            .select()
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

        const { data, error } = await supabase.from('matches').insert([matchData]).select('*, competitions(name)').single();
        if (data) {
          set((state) => ({ matches: [...state.matches, mapMatchFromDb(data)] }));
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
              .select()
              .single();
            if (newComp) {
              competitionId = newComp.id;
              set(state => ({ competitions: [...state.competitions, newComp] }));
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
            .select()
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

        const { data, error } = await supabase.from('matches').update(matchData).eq('id', m.id).select('*, competitions(name)').single();
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
      
      fetchMatchEntries: async () => {
        // Only fetch the most recent 500 entries to prevent memory crashes.
        // Full data is accessed via paginated queries or RPC functions.
        const { data, error } = await supabase
          .from('match_entries')
          .select('*')
          .order('date', { ascending: false })
          .limit(500);
          
        if (data) {
          set({ matchEntries: data.map(mapMatchEntryFromDb) });
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
              .select()
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

        const { data, error } = await supabase.from('match_entries').insert([entryData]).select('*, matches(date)').single();
        if (data) {
          const newEntry = mapMatchEntryFromDb(data);
          set((state) => ({ matchEntries: [...state.matchEntries, newEntry] }));
          
          // Database trigger handles stats sync, just fetch the updated stats
          await get().fetchPlayerSeasonStats();
          await get().fetchMatchEntries(); // Refresh match entries completely to ensure everything is in sync
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
        
        const { data, error } = await supabase.from('match_entries').update(entryData).eq('id', e.id).select('*, matches(date)').single();
        if (data) {
          const updatedEntry = mapMatchEntryFromDb(data);
          set((state) => ({ matchEntries: state.matchEntries.map(x => x.id === e.id ? updatedEntry : x) }));
          // Database trigger handles stats sync, just fetch the updated stats
          await get().fetchPlayerSeasonStats();
          await get().fetchMatchEntries(); // Refresh match entries completely to ensure everything is in sync
          // Auto-milestone check
          const fired = await checkAndFireMilestones(updatedEntry.playerId);
          if (fired) await get().fetchNews();
        }
        if (error) console.error('Error updating match entry:', error);
      },
      
      removeMatchEntry: async (id) => {
        const entry = get().matchEntries.find(x => x.id === id);
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
        const { data, error } = await supabase.from('news').select('*');
        if (data) set({ news: data as NewsArticle[] });
        if (error) console.error('Error fetching news:', error);
      },
      setNews: (news) => set({ news }),
      addNews: async (n) => {
        const { id, ...newsData } = n;
        const { data, error } = await supabase.from('news').insert([newsData]).select().single();
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
        const { data, error } = await supabase.from('news').update(newsData).eq('id', id).select().single();
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
        const { data, error } = await supabase.from('season').select('*').order('name', { ascending: true });
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
              .select()
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
          .select()
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
        // Set all seasons is_current to false
        const { error: resetError } = await supabase.from('season').update({ is_current: false }).neq('id', id);
        if (resetError) {
          console.error('Error resetting current seasons:', resetError);
          return;
        }

        // Set specific season is_current to true
        const { data, error } = await supabase.from('season').update({ is_current: true }).eq('id', id).select().single();
        if (data) {
          set((state) => ({
            seasons: state.seasons.map(s => s.id === id ? { ...s, is_current: true } : { ...s, is_current: false })
          }));
        }
        if (error) console.error('Error setting current season:', error);
      },

      fetchPlayerSeasonStats: async () => {
        const { data, error } = await supabase.from('player_season_stats').select('*');
        if (data) {
          const seasons = get().seasons;
          set({
            playerSeasonStats: data.map(item => {
              const seasonObj = seasons.find(s => s.id === item.season_id);
              return {
                id: item.id,
                playerId: item.player_id,
                seasonId: item.season_id,
                seasonName: seasonObj?.name || `Season ${item.season_id}`,
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
        const { data, error } = await supabase.from('competitions').select('*');
        if (data) {
          set({ competitions: data as Competition[] });
        }
        if (error) console.error('Error fetching competitions:', error);
      },

      fetchAvailableRoles: async () => {
        const { data, error } = await supabase
          .from('player_role')
          .select('*')
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
        const { data, error } = await supabase
          .from('custom_tags')
          .select('*')
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
        const { data, error } = await supabase.from('hall_of_frame').select('*');
        if (data) {
          set({ hallOfFame: data.map(mapHallOfFameFromDb) });
        }
        if (error) console.error('Error fetching Hall of Fame:', error);
      },

      addHallOfFameEntry: async (entry) => {
        const dbData = mapHallOfFameToDb(entry);
        const { data, error } = await supabase.from('hall_of_frame').insert([dbData]).select().single();
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
        const { data, error } = await supabase.from('hall_of_frame').update(dbData).eq('id', entry.id).select().single();
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
    }),
    { enabled: process.env.NODE_ENV !== 'production' }
  )
);
