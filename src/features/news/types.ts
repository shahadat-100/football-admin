import { z } from 'zod';
import { newsSchema, newsFormSchema } from './schemas';

export type NewsArticle = z.infer<typeof newsSchema>;
export type NewsFormValues = z.infer<typeof newsFormSchema>;
