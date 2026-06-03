import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Player } from '@/features/players/types';
import { Match } from '@/features/matches/types';
import { MatchEntry } from '@/features/match-entries/types';
import { NewsArticle } from '@/features/news/types';
import { HOME_TEAM } from '@/shared/lib/constants';

const CURRENT_YEAR = new Date().getFullYear();

interface FootballStore {
  players: Player[];
  matches: Match[];
  matchEntries: MatchEntry[];
  news: NewsArticle[];
  
  setPlayers: (p: Player[]) => void;
  addPlayer: (p: Player) => void;
  updatePlayer: (p: Player) => void;
  removePlayer: (id: string) => void;
  
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

const initialPlayers: Player[] = [
  {id:'p1',name:'Mohamed Salah',jerseyNumber:11,playerRoles:['First Team'],customTags:['pacey','clinical'],createdAt:'2024-01-10',
   profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salah',
   seasons:[{year:2024,monthlyStats:[{month:1,weeklyStats:[{week:1,matches:5,win:3,loss:1,draw:1,goalsScored:10,goalsConceded:4,hattricks:2,motm:1,cleanSheet:1},{week:2,matches:3,win:1,loss:1,draw:1,goalsScored:5,goalsConceded:5,hattricks:0,motm:0,cleanSheet:0}]},{month:2,weeklyStats:[{week:1,matches:4,win:2,loss:1,draw:1,goalsScored:8,goalsConceded:3,hattricks:1,motm:2,cleanSheet:1}]}]},{year:CURRENT_YEAR,monthlyStats:[]}]},
  {id:'p2',name:'Bukayo Saka',jerseyNumber:7,playerRoles:['First Team'],customTags:['technical','young'],createdAt:'2024-01-12',
   profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Saka',
   seasons:[{year:2024,monthlyStats:[]},{year:CURRENT_YEAR,monthlyStats:[]}]},
];

const initialMatches: Match[] = [
  {id:'m1',homeTeam:HOME_TEAM as "The Elits",awayTeam:'Man City',homeScore:2,awayScore:1,date:'2024-03-15',competition:'Premier League',status:'finished'},
];

const initialMatchEntries: MatchEntry[] = [
  {id:'me1',playerId:'p1',matchId:'m1',goals:2,goalsConceded:1,result:'win',hattricks:0,cleanSheet:false,motm:true,date:'2024-03-15',notes:'Outstanding performance'},
];

export const useFootballStore = create<FootballStore>()(
  devtools(
    persist(
      (set, get) => ({
        players: initialPlayers,
        matches: initialMatches,
        matchEntries: initialMatchEntries,
        news: [],
        
        setPlayers: (players) => set({ players }),
        addPlayer: (p) => set((state) => ({ players: [...state.players, p] })),
        updatePlayer: (p) => set((state) => ({ players: state.players.map(x => x.id === p.id ? p : x) })),
        removePlayer: (id) => {
          const players = get().players.filter(x => x.id !== id);
          set({ 
            players, 
            matchEntries: get().matchEntries.filter((m: MatchEntry) => m.playerId !== id) 
          });
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
      { name: 'football-store' }
    ),
    { enabled: process.env.NODE_ENV !== 'production' }
  )
);
