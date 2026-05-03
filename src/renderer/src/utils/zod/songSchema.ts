import { songFilterTypes, songSortTypes } from '@renderer/components/SongsPage/SongOptions';
import { z } from 'zod';

import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';

export const songSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(songSortTypes).optional(),
  filteringOrder: z.enum(songFilterTypes).optional()
});

export type SongSearchSchema = z.infer<typeof songSearchSchema>;
