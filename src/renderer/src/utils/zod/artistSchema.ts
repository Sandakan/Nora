import { artistFilterTypes, artistSortTypes } from '@renderer/components/ArtistPage/ArtistOptions';
import { z } from 'zod';

import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';

export const artistSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(artistSortTypes).optional(),
  filteringOrder: z.enum(artistFilterTypes).optional()
});

export type ArtistSearchSchema = z.infer<typeof artistSearchSchema>;
