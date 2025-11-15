import { z } from 'zod';
import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';
import { playlistSortTypes } from '@renderer/components/PlaylistsPage/PlaylistOptions';

export const playlistSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(playlistSortTypes).optional()
});

export type PlaylistSearchSchema = z.infer<typeof playlistSearchSchema>;
