import { z } from 'zod';
import { NEWS_CATEGORIES } from '@/shared/lib/constants';

export const newsSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title required"),
  content: z.string(),
  author: z.string(),
  hot: z.boolean().default(false),
  date: z.string(),
  category: z.enum(NEWS_CATEGORIES as unknown as [string, ...string[]]),
  image: z.string().optional(),
  created_at: z.string().optional(),
});
export const newsFormSchema = newsSchema.omit({ id: true, created_at: true });
