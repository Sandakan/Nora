import { z } from 'zod';

export const lyricsSchema = z.object({
  isAutoScrolling: z.boolean().optional().default(true)
});

export type LyricsSchema = z.infer<typeof lyricsSchema>;
