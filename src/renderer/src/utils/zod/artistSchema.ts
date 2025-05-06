import { z } from 'zod';
import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';
import { artistFilterTypes, artistSortTypes } from '@renderer/components/ArtistPage/ArtistOptions';

export const artistSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(artistSortTypes).optional(),
  filteringOrder: z.enum(artistFilterTypes).optional()
});

export type ArtistSearchSchema = z.infer<typeof artistSearchSchema>;
