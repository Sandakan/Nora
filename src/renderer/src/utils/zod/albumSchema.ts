import { z } from 'zod';
import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';
import { albumSortTypes } from '@renderer/components/AlbumsPage/AlbumOptions';

export const albumSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(albumSortTypes).optional()
});

export type AlbumSearchSchema = z.infer<typeof albumSearchSchema>;
