import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Player } from '@/features/players/types';
import { Match } from '@/features/matches/types';
import { MatchEntry } from '@/features/match-entries/types';
import { NewsArticle } from '@/features/news/types';
import { supabase } from '@/lib/supabase';

interface FootballStore {
  players: Player[];
  matches: Match[];
  matchEntries: MatchEntry[];
  news: NewsArticle[];
  
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
}

export const useFootballStore = create<FootballStore>()(
  devtools(
    (set, get) => ({
      players: [],
      matches: [],
      matchEntries: [],
      news: [],
      
      fetchPlayers: async () => {
        const { data, error } = await supabase.from('players').select('*');
        if (data) set({ players: data as Player[] });
        if (error) console.error('Error fetching players:', error);
      },
      setPlayers: (players) => set({ players }),
      addPlayer: async (p) => {
        // Only send columns that exist in the DB - strip any extra form fields
        const playerData = {
          name: p.name,
          profileImageUrl: p.profileImageUrl ?? '',
          jerseyNumber: p.jerseyNumber ?? null,
          playerRoles: p.playerRoles ?? [],
          customTags: p.customTags ?? [],
          seasons: (p as any).seasons ?? [],
        };
        const { data, error } = await supabase.from('players').insert([playerData]).select().single();
        if (data) set((state) => ({ players: [...state.players, data as Player] }));
        if (error) {
          console.error('Error adding player:', error);
          alert('Failed to save player: ' + error.message);
        }
      },
      updatePlayer: async (p) => {
        const playerData = {
          name: p.name,
          profileImageUrl: p.profileImageUrl ?? '',
          jerseyNumber: p.jerseyNumber ?? null,
          playerRoles: p.playerRoles ?? [],
          customTags: p.customTags ?? [],
          seasons: (p as any).seasons ?? [],
        };
        const { data, error } = await supabase.from('players').update(playerData).eq('id', p.id).select().single();
        if (data) set((state) => ({ players: state.players.map(x => x.id === p.id ? (data as Player) : x) }));
        if (error) {
          console.error('Error updating player:', error);
          alert('Failed to update player: ' + error.message);
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
        const { data, error } = await supabase.from('matches').select('*');
        if (data) set({ matches: data as Match[] });
        if (error) console.error('Error fetching matches:', error);
      },
      setMatches: (matches) => set({ matches }),
      addMatch: async (m) => {
        const { id, ...matchData } = m;
        const { data, error } = await supabase.from('matches').insert([matchData]).select().single();
        if (data) set((state) => ({ matches: [...state.matches, data as Match] }));
        if (error) {
          console.error('Error adding match:', error);
          alert('Failed to save match: ' + error.message);
        }
      },
      updateMatch: async (m) => {
        const { id, ...matchData } = m;
        const { data, error } = await supabase.from('matches').update(matchData).eq('id', id).select().single();
        if (data) set((state) => ({ matches: state.matches.map(x => x.id === id ? (data as Match) : x) }));
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
        const { data, error } = await supabase.from('match_entries').select('*');
        if (data) set({ matchEntries: data as MatchEntry[] });
        if (error) console.error('Error fetching match entries:', error);
      },
      setMatchEntries: (matchEntries) => set({ matchEntries }),
      addMatchEntry: async (e) => {
        const { id, ...entryData } = e;
        const { data, error } = await supabase.from('match_entries').insert([entryData]).select().single();
        if (data) set((state) => ({ matchEntries: [...state.matchEntries, data as MatchEntry] }));
        if (error) {
          console.error('Error adding match entry:', error);
          alert('Failed to save entry: ' + error.message);
        }
      },
      updateMatchEntry: async (e) => {
        const { data, error } = await supabase.from('match_entries').update(e).eq('id', e.id).select().single();
        if (data) set((state) => ({ matchEntries: state.matchEntries.map(x => x.id === e.id ? (data as MatchEntry) : x) }));
        if (error) console.error('Error updating match entry:', error);
      },
      removeMatchEntry: async (id) => {
        const { error } = await supabase.from('match_entries').delete().eq('id', id);
        if (!error) set((state) => ({ matchEntries: state.matchEntries.filter(x => x.id !== id) }));
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
        if (data) set((state) => ({ news: [...state.news, data as NewsArticle] }));
        if (error) console.error('Error adding news:', error);
      },
      updateNews: async (n) => {
        const { data, error } = await supabase.from('news').update(n).eq('id', n.id).select().single();
        if (data) set((state) => ({ news: state.news.map(x => x.id === n.id ? (data as NewsArticle) : x) }));
        if (error) console.error('Error updating news:', error);
      },
      removeNews: async (id) => {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (!error) set((state) => ({ news: state.news.filter(x => x.id !== id) }));
        else console.error('Error removing news:', error);
      },
    }),
    { enabled: process.env.NODE_ENV !== 'production' }
  )
);
