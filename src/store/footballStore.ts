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
  createdAt: p.createdat || '',
  seasons: [],
});

// Only send columns that actually exist on the players table
export const mapPlayerToDb = (p: any) => ({
  name: p.name,
  profileimageurl: p.profileImageUrl || '',
  jerseynumber: p.jerseyNumber ?? null,
  email: p.email || null,
});

export const mapMatchFromDb = (m: any): Match => ({
  id: m.id,
  seasonId: m.season_id,
  homeTeam: m.hometeam,
  awayTeam: m.awayteam,
  homeScore: m.homescore,
  awayScore: m.awayscore,
  date: m.date,
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
  status: m.status,
  competition_id: m.competitionId,
});

export const mapMatchEntryFromDb = (e: any): MatchEntry => ({
  id: e.id,
  playerId: e.playerid,
  matchId: e.matchid,
  goals: e.goals || 0,
  goalsConceded: e.goalsconceded || 0,
  result: e.result,
  hattricks: e.hattricks || 0,
  cleanSheet: e.cleansheet || false,
  motm: e.motm || false,
  date: e.matches?.date || '',
  notes: e.notes || '',
  seasonId: e.season_id,
});

export const mapMatchEntryToDb = (e: any) => ({
  playerid: e.playerId,
  matchid: e.matchId,
  goals: e.goals || 0,
  goalsconceded: e.goalsConceded || 0,
  result: e.result,
  hattricks: e.hattricks || 0,
  cleansheet: e.cleanSheet || false,
  motm: e.motm || false,
  notes: e.notes || '',
  season_id: e.seasonId,
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

// Upsert role names into player_role master table, then link to player via junction table
const syncPlayerRoles = async (playerId: string, roles: string[]) => {
  // Delete existing role links for this player
  await supabase.from('player_player_roles').delete().eq('player_id', playerId);
  if (!roles || roles.length === 0) return;
  for (const name of roles) {
    if (!name.trim()) continue;
    // Upsert role into master table
    const { data: roleData } = await supabase
      .from('player_role')
      .upsert({ name: name.trim(), status: true }, { onConflict: 'name' })
      .select('id')
      .single();
    if (roleData) {
      // Link player to role via junction table
      await supabase
        .from('player_player_roles')
        .upsert({ player_id: playerId, role_id: roleData.id }, { onConflict: 'player_id,role_id' });
    }
  }
};

// Upsert tag names into custom_tags master table, then link to player via junction table
const syncPlayerTags = async (playerId: string, tags: string[]) => {
  // Delete existing tag links for this player
  await supabase.from('player_custom_tags').delete().eq('player_id', playerId);
  if (!tags || tags.length === 0) return;
  for (const name of tags) {
    if (!name.trim()) continue;
    // Upsert tag into master table
    const { data: tagData } = await supabase
      .from('custom_tags')
      .upsert({ name: name.trim(), status: true }, { onConflict: 'name' })
      .select('id')
      .single();
    if (tagData) {
      // Link player to tag via junction table
      await supabase
        .from('player_custom_tags')
        .upsert({ player_id: playerId, tag_id: tagData.id }, { onConflict: 'player_id,tag_id' });
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

    const totals = {
      goals:       statsRows.reduce((s, e) => s + (e.goals       || 0), 0),
      cleansheets: statsRows.reduce((s, e) => s + (e.cleansheets || 0), 0),
      hattricks:   statsRows.reduce((s, e) => s + (e.hattricks   || 0), 0),
      appearances: statsRows.reduce((s, e) => s + (e.appearances || 0), 0),
      motm:        statsRows.reduce((s, e) => s + (e.motmcount   || 0), 0),
      wins:        statsRows.reduce((s, e) => s + (e.wins        || 0), 0),
    };

    const { data: entries } = await supabase
      .from('match_entries')
      .select('result, matches(date)')
      .eq('playerid', playerId);

    const sorted = ((entries ?? []) as any[])
      .filter(e => e.matches?.date)
      .sort((a, b) => new Date(a.matches.date).getTime() - new Date(b.matches.date).getTime());

    let winStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].result === 'win') winStreak++;
      else break;
    }
    let unbeatenStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].result !== 'loss') unbeatenStreak++;
      else break;
    }

    type MCheck = { key: string; emoji: string };
    const triggered: MCheck[] = [];
    const chk = (thresholds: number[], current: number, stat: string, emoji: string) =>
      thresholds.filter(t => current >= t).forEach(t => triggered.push({ key: `${stat}_${t}`, emoji }));

    chk(GOAL_MILESTONES,        totals.goals,       'goals',       '⚽');
    chk(MOTM_MILESTONES,        totals.motm,        'motm',        '🏅');
    chk(CLEAN_SHEET_MILESTONES, totals.cleansheets, 'cleansheets', '🧤');
    chk(HATTRICK_MILESTONES,    totals.hattricks,   'hattricks',   '🎩');
    chk(APPEARANCE_MILESTONES,  totals.appearances, 'appearances', '📅');
    chk(WIN_MILESTONES,         totals.wins,        'wins',        '🏆');
    chk(WIN_STREAK_MILESTONES,  winStreak,          'win_streak',  '🔥');
    chk(UNBEATEN_MILESTONES,    unbeatenStreak,     'unbeaten',    '🛡️');

    if (triggered.length === 0) return false;

    const { data: logged } = await supabase
      .from('milestone_log').select('milestone_key').eq('player_id', playerId);
    const loggedKeys = new Set((logged ?? []).map((l: any) => l.milestone_key));
    const newOnes = triggered.filter(m => !loggedKeys.has(m.key));
    if (newOnes.length === 0) return false;

    for (const m of newOnes) {
      const threshold = parseInt(m.key.split('_').slice(-1)[0]);
      const { error: logErr } = await supabase.from('milestone_log').insert({
        player_id: playerId,
        milestone_key: m.key,
      });
      if (logErr) continue;
      await supabase.from('news').insert({
        title:    _milestoneTitle(playerName, m.key, threshold, m.emoji),
        content:  _milestoneContent(playerName, m.key, threshold),
        author:   'Club Records',
        category: 'Player',
        hot:      true,
        date:     new Date().toISOString().split('T')[0],
      });
    }
    return true;
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
      
      fetchPlayers: async () => {
        const { data, error } = await supabase
          .from('players')
          .select(`
            *,
            player_player_roles(
              role_id,
              player_role(name)
            ),
            player_custom_tags(
              tag_id,
              custom_tags(name)
            )
          `);
        if (data) {
          set({ players: data.map(mapPlayerFromDb) });
        }
        if (error) console.error('Error fetching players:', error);
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

          // Save previous seasons data directly to player_season_stats
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

              let appearances = 0;
              let goals = 0;
              let cleansheets = 0;
              let hattricks = 0;
              let motmcount = 0;
              let wins = 0;
              let draws = 0;
              let losses = 0;
              let goalsconceded = 0;

              for (const month of season.monthlyStats ?? []) {
                for (const week of month.weeklyStats ?? []) {
                  appearances += week.matches || 0;
                  goals += week.goalsScored || 0;
                  cleansheets += week.cleanSheet || 0;
                  hattricks += week.hattricks || 0;
                  motmcount += week.motm || 0;
                  wins += week.win || 0;
                  draws += week.draw || 0;
                  losses += week.loss || 0;
                  goalsconceded += week.goalsConceded || 0;
                }
              }

              await supabase.from('player_season_stats').insert({
                player_id: newPlayerId,
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
        const { data, error } = await supabase.from('match_entries').select('*, matches(date)');
        if (data) {
          set({ matchEntries: data.map(mapMatchEntryFromDb) });
        }
        if (error) console.error('Error fetching match entries:', error);
      },
      setMatchEntries: (matchEntries) => set({ matchEntries }),
      
      addMatchEntry: async (e) => {
        let matchId = e.matchId;
        let seasonId: number;
        
        // If matchId is empty (custom entry with no official match), we create a placeholder match to preserve relational integrity and date
        if (!matchId) {
          const year = e.date ? e.date.split('-')[0] : new Date().getFullYear().toString();
          const seasonName = `Season ${year}`;
          let tempSeasonId: number;

          const existingSeason = get().seasons.find(s => s.name === seasonName);
          if (existingSeason) {
            tempSeasonId = existingSeason.id;
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
              console.error('Failed to auto-create season for match entry:', seasonError);
              alert('Failed to add entry: ' + (seasonError?.message || 'Season error'));
              return;
            }

            tempSeasonId = newSeason.id;
            set(state => ({ seasons: [...state.seasons, newSeason] }));
          }

          const { data: dummyMatch, error: dummyMatchError } = await supabase
            .from('matches')
            .insert({
              season_id: tempSeasonId,
              hometeam: 'The Elits',
              awayteam: 'Custom Entry Match',
              date: e.date || new Date().toISOString().split('T')[0],
              status: 'finished',
            })
            .select()
            .single();

          if (dummyMatchError || !dummyMatch) {
            console.error('Failed to create placeholder match:', dummyMatchError);
            alert('Failed to create entry: ' + dummyMatchError?.message);
            return;
          }
          matchId = dummyMatch.id;
          seasonId = tempSeasonId;
          // Refresh matches in state
          await get().fetchMatches();
        } else {
          // Get the season ID associated with the match
          const associatedMatch = get().matches.find(m => m.id === matchId);
          if (associatedMatch && associatedMatch.seasonId) {
            seasonId = associatedMatch.seasonId;
          } else {
            alert('Cannot save match entry: no season associated.');
            return;
          }
        }

        const entryData = mapMatchEntryToDb({
          ...e,
          matchId,
          seasonId,
        });

        const { data, error } = await supabase.from('match_entries').insert([entryData]).select('*, matches(date)').single();
        if (data) {
          const newEntry = mapMatchEntryFromDb(data);
          set((state) => ({ matchEntries: [...state.matchEntries, newEntry] }));
          
          // Background Sync Player Season Stats
          await updatePlayerSeasonStats(newEntry.playerId, seasonId);
          await get().fetchPlayerSeasonStats();
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
          
          await updatePlayerSeasonStats(updatedEntry.playerId, seasonId);
          await get().fetchPlayerSeasonStats();
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
            await updatePlayerSeasonStats(entry.playerId, entry.seasonId);
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
        const { data, error } = await supabase.from('player_season_stats').select('*, season(name)');
        if (data) {
          set({
            playerSeasonStats: data.map(item => ({
              id: item.id,
              playerId: item.player_id,
              seasonId: item.season_id,
              seasonName: item.season?.name || `Season ${item.season_id}`,
              appearances: item.appearances || 0,
              goals: item.goals || 0,
              cleansheets: item.cleansheets || 0,
              hattricks: item.hattricks || 0,
              motmCount: item.motmcount || 0,
              wins: item.wins || 0,
              draws: item.draws || 0,
              losses: item.losses || 0,
              goalsConceded: item.goalsconceded || 0,
            }))
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
