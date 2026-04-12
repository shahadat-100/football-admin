import { z } from 'zod';
import { playerSchema, seasonSchema, monthlyStatSchema, weeklyStatSchema, playerFormSchema } from './schemas';

export type Player = z.infer<typeof playerSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type MonthlyStat = z.infer<typeof monthlyStatSchema>;
export type WeeklyStat = z.infer<typeof weeklyStatSchema>;
export type PlayerFormValues = z.infer<typeof playerFormSchema>;
