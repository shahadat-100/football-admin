import { z } from 'zod';
import { MATCH_STATUSES, HOME_TEAM } from '@/shared/lib/constants';

export const matchSchema = z.object({
  id: z.string(),
  homeTeam: z.literal(HOME_TEAM).default(HOME_TEAM),
  awayTeam: z.string().min(1, "Away team required"),
  homeScore: z.number().optional().nullable(),
  awayScore: z.number().optional().nullable(),
  date: z.string().min(1),
  time: z.string().optional().nullable(),
  competition: z.string().min(1, "Competition required"),
  status: z.enum(MATCH_STATUSES as unknown as [string, ...string[]]),
  seasonId: z.number().optional().nullable(),
  competitionId: z.number().optional().nullable(),
});

export const matchFormSchema = matchSchema.omit({ id: true }).extend({
  homeScore: z.union([z.string(), z.number()]).optional().transform(v => v === '' ? null : Number(v)),
  awayScore: z.union([z.string(), z.number()]).optional().transform(v => v === '' ? null : Number(v)),
});
