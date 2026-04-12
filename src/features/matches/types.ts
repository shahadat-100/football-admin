import { z } from 'zod';
import { matchSchema, matchFormSchema } from './schemas';

export type Match = z.infer<typeof matchSchema>;
export type MatchFormValues = z.infer<typeof matchFormSchema>;
