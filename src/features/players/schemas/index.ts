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
  position: z.enum(POSITIONS as unknown as [string, ...string[]]),
  jersey: z.number().min(0).max(99).optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  profileImage: z.string().optional(),
  credential: z.string().min(4, "Min 4 characters").optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  seasons: z.array(seasonSchema).default([]),
});

export const playerFormSchema = playerSchema.omit({ id: true, createdAt: true }).extend({
  tags: z.string().optional(),
  jersey: z.union([z.string(), z.number()]).optional(),
});
