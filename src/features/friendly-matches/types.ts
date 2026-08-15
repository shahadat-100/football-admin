import { z } from 'zod';
import { friendlyMatchSchema, friendlyMatchFormSchema } from './schemas';

export type FriendlyMatch = z.infer<typeof friendlyMatchSchema>;
export type FriendlyMatchFormValues = z.infer<typeof friendlyMatchFormSchema>;
