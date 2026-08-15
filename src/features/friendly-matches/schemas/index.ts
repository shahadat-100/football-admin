import { z } from 'zod';

export const friendlyMatchSchema = z.object({
  id: z.string(),
  player1Id: z.string().min(1, 'Player 1 required'),
  player2Id: z.string().min(1, 'Player 2 required'),
  player1Goals: z.number().min(0).default(0),
  player2Goals: z.number().min(0).default(0),
  date: z.string().min(1, 'Date required'),
  time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
});

export const friendlyMatchFormSchema = friendlyMatchSchema.omit({ id: true, createdAt: true }).extend({
  player1Goals: z.union([z.string(), z.number()]).transform(v => Number(v)).default(0),
  player2Goals: z.union([z.string(), z.number()]).transform(v => Number(v)).default(0),
}).refine(data => data.player1Id !== data.player2Id, {
  message: 'Players must be different',
  path: ['player2Id'],
});
