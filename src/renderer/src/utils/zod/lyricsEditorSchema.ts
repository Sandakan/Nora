import { z } from 'zod';

const syncedLyricsLineWordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number()
});

// Define the schema for LyricData
export const lyricDataSchema = z.object({
  text: z.union([z.string(), z.array(syncedLyricsLineWordSchema)]),
  start: z.number().optional(),
  end: z.number().optional()
});

export const lyricsEditorSchema = z.object({
  songTitle: z.string().optional(),
  isEditingEnhancedSyncedLyrics: z.boolean().optional().default(false)
});

export type LyricsEditorSchema = z.infer<typeof lyricsEditorSchema>;
