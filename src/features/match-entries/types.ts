import { z } from 'zod';
import { matchEntrySchema, matchEntryFormSchema } from './schemas';

export type MatchEntry = z.infer<typeof matchEntrySchema>;
export type MatchEntryFormValues = z.infer<typeof matchEntryFormSchema>;
