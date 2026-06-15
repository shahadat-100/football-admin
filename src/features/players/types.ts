import { z } from 'zod';
import { playerSchema, seasonSchema, monthlyStatSchema, weeklyStatSchema, playerFormSchema, seasonDbSchema } from './schemas';

export type Player = z.infer<typeof playerSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type MonthlyStat = z.infer<typeof monthlyStatSchema>;
export type WeeklyStat = z.infer<typeof weeklyStatSchema>;
export type PlayerFormValues = z.infer<typeof playerFormSchema>;

export type SeasonDb = z.infer<typeof seasonDbSchema>;

export interface PlayerSeasonStat {
  id: string;
  playerId: string;
  seasonId: number;
  seasonName: string;
  appearances: number;
  goals: number;
  cleansheets: number;
  hattricks: number;
  motmCount: number;
  wins: number;
  draws: number;
  losses: number;
  goalsConceded: number;
  points?: number;
  updatedAt?: string;
}
