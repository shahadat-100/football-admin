import { z } from 'zod';
import { POSITIONS } from '@/shared/lib/constants';

export const weeklyStatSchema = z.object({
  week: z.number().min(1).max(5),
  matches: z.number().min(0).default(0),
  win: z.number().min(0).default(0),
  loss: z.number().min(0).default(0),
  draw: z.number().min(0).default(0),
  goalsScored: z.number().min(0).default(0),
  goalsConceded: z.number().min(0).default(0),
  hattricks: z.number().min(0).default(0),
  motm: z.number().min(0).default(0),
  cleanSheet: z.number().min(0).default(0),
});

export const monthlyStatSchema = z.object({
  month: z.number().min(1).max(12),
  weeklyStats: z.array(weeklyStatSchema).default([])
});

export const seasonSchema = z.object({
  year: z.number(),
  monthlyStats: z.array(monthlyStatSchema).default([])
});

export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6),
  profileImageUrl: z.string().optional(),
  jerseyNumber: z.number().optional(),
  playerRoles: z.array(z.string()).default([]),
  customTags: z.array(z.string()).default([]),
  createdAt: z.string(),
  seasons: z.array(seasonSchema).default([]),
});

export const playerFormSchema = playerSchema.omit({ id: true, createdAt: true, seasons: true }).extend({
  jerseyNumber: z.union([z.string(), z.number()]).optional().transform(v => v === '' ? undefined : Number(v)),
  customTags: z.union([z.string(), z.array(z.string())]).optional().transform(v => {
    if (typeof v === 'string') {
      return v.split(',').map(s => s.trim()).filter(Boolean);
    }
    return v || [];
  }),
});
