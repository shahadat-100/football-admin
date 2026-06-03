import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Player } from '@/features/players/types';
import { Match } from '@/features/matches/types';
import { MatchEntry } from '@/features/match-entries/types';
import { NewsArticle } from '@/features/news/types';
import { HOME_TEAM } from '@/shared/lib/constants';
import { supabase } from '@/lib/supabase';
const CURRENT_YEAR = new Date().getFullYear();

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
  
  setMatches: (m: Match[]) => void;
  addMatch: (m: Match) => void;
  updateMatch: (m: Match) => void;
  removeMatch: (id: string) => void;
  
  setMatchEntries: (e: MatchEntry[]) => void;
  addMatchEntry: (e: MatchEntry) => void;
  updateMatchEntry: (e: MatchEntry) => void;
  removeMatchEntry: (id: string) => void;
  
  setNews: (n: NewsArticle[]) => void;
  addNews: (n: NewsArticle) => void;
  updateNews: (n: NewsArticle) => void;
  removeNews: (id: string) => void;
}

const initialPlayers: Player[] = [];

const initialMatches: Match[] = [
  {id:'m1',homeTeam:HOME_TEAM as "The Elits",awayTeam:'Man City',homeScore:2,awayScore:1,date:'2024-03-15',competition:'Premier League',status:'finished'},
];

const initialMatchEntries: MatchEntry[] = [
  {id:'me1',playerId:'p1',matchId:'m1',goals:2,goalsConceded:1,result:'win',hattricks:0,cleanSheet:false,motm:true,date:'2024-03-15',notes:'Outstanding performance'},
];

export const useFootballStore = create<FootballStore>()(
  devtools(
    (set, get) => ({
      players: initialPlayers,
      matches: initialMatches,
      matchEntries: initialMatchEntries,
      news: [],
      
      fetchPlayers: async () => {
        const { data, error } = await supabase.from('players').select('*');
        if (data) set({ players: data as Player[] });
        if (error) console.error('Error fetching players:', error);
      },
      setPlayers: (players) => set({ players }),
      addPlayer: async (p) => {
        const { id, ...playerData } = p;
        const { data, error } = await supabase.from('players').insert([playerData]).select().single();
        if (data) set((state) => ({ players: [...state.players, data as Player] }));
        if (error) console.error('Error adding player:', error);
      },
      updatePlayer: async (p) => {
        const { data, error } = await supabase.from('players').update(p).eq('id', p.id).select().single();
        if (data) set((state) => ({ players: state.players.map(x => x.id === p.id ? (data as Player) : x) }));
        if (error) console.error('Error updating player:', error);
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
        }
      },
      
      setMatches: (matches) => set({ matches }),
      addMatch: (m) => set((state) => ({ matches: [...state.matches, m] })),
      updateMatch: (m) => set((state) => ({ matches: state.matches.map(x => x.id === m.id ? m : x) })),
      removeMatch: (id) => set((state) => ({ matches: state.matches.filter(x => x.id !== id) })),
      
      setMatchEntries: (matchEntries) => set({ matchEntries }),
      addMatchEntry: (e) => set((state) => ({ matchEntries: [...state.matchEntries, e] })),
      updateMatchEntry: (e) => set((state) => ({ matchEntries: state.matchEntries.map(x => x.id === e.id ? e : x) })),
      removeMatchEntry: (id) => set((state) => ({ matchEntries: state.matchEntries.filter(x => x.id !== id) })),
      
      setNews: (news) => set({ news }),
      addNews: (n) => set((state) => ({ news: [...state.news, n] })),
      updateNews: (n) => set((state) => ({ news: state.news.map(x => x.id === n.id ? n : x) })),
      removeNews: (id) => set((state) => ({ news: state.news.filter(x => x.id !== id) })),
    }),
    { enabled: process.env.NODE_ENV !== 'production' }
  )
);
