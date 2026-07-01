import { z } from 'zod';

export const monthlyStatSchema = z.object({
  month: z.number().min(1).max(12),
  matches: z.number().min(0).default(0),
  matchDates: z.array(z.string()).default([]),
  win: z.number().min(0).default(0),
  loss: z.number().min(0).default(0),
  draw: z.number().min(0).default(0),
  goalsScored: z.number().min(0).default(0),
  goalsConceded: z.number().min(0).default(0),
  hattricks: z.number().min(0).default(0),
  motm: z.number().min(0).default(0),
  cleanSheet: z.number().min(0).default(0),
});


export const seasonSchema = z.object({
  year: z.number(),
  monthlyStats: z.array(monthlyStatSchema).default([])
});

export const seasonDbSchema = z.object({
  id: z.number(),
  name: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().default(false),
});

export const playerSeasonStatSchema = z.object({
  id: z.string(),
  player_id: z.string(),
  season_id: z.number(),
  appearances: z.number().default(0),
  goals: z.number().default(0),
  cleansheets: z.number().default(0),
  hattricks: z.number().default(0),
  motmcount: z.number().default(0),
  wins: z.number().default(0),
  draws: z.number().default(0),
  losses: z.number().default(0),
  goalsconceded: z.number().default(0),
  updated_at: z.string().optional(),
});

export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  profileImageUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  jerseyNumber: z.number().optional(),
  dateOfBirth: z.string().optional(),
  education: z.string().optional(),
  location: z.string().optional(),
  playerRoles: z.array(z.string()).default([]),
  customTags: z.array(z.string()).default([]),
  customStringTags: z.array(z.string()).default([]),
  createdAt: z.string(),
  seasons: z.array(seasonSchema).default([]),
  email: z.string().email('Valid email is required'),
});

export const playerFormSchema = playerSchema.omit({ id: true, createdAt: true, seasons: true }).extend({
  jerseyNumber: z.union([z.string(), z.number()]).optional().transform(v => v === '' ? undefined : Number(v)),
  customTags: z.union([z.string(), z.array(z.string())]).optional().transform(v => {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  }),
  customStringTags: z.array(z.string()).default([]),
  previousSeasons: z.array(z.object({
    season: z.string(),
    goals: z.number(),
  })).default([]),
});
