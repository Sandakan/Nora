import { albumSortTypes } from '@renderer/components/AlbumsPage/AlbumOptions';
import { z } from 'zod';

import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';

export const albumSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(albumSortTypes).optional()
});

export type AlbumSearchSchema = z.infer<typeof albumSearchSchema>;
