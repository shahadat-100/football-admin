import { z } from 'zod';
import { RESULTS } from '@/shared/lib/constants';

export const matchEntrySchema = z.object({
  id: z.string(),
  playerId: z.string().min(1, "Player selection required"),
  matchId: z.string().min(1, "Match selection required"),
  goals: z.number().min(0).default(0),
  goalsConceded: z.number().min(0).default(0),
  result: z.enum(RESULTS as unknown as [string, ...string[]]),
  hattricks: z.number().min(0).default(0),
  cleanSheet: z.boolean().default(false),
  motm: z.boolean().default(false),
  date: z.string(),
  time: z.string().optional().nullable(),
  notes: z.string().optional(),
  seasonId: z.number().optional().nullable(),
});
export const matchEntryFormSchema = matchEntrySchema.omit({ id: true, hattricks: true }).extend({
  goals: z.union([z.string(), z.number()]).transform(val => Number(val)).default(0),
  goalsConceded: z.union([z.string(), z.number()]).transform(val => Number(val)).default(0),
});
