import { z } from 'zod';
import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';
import { genreSortTypes } from '@renderer/components/GenresPage/genreOptions';

export const genreSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(genreSortTypes).optional()
});

export type GenreSearchSchema = z.infer<typeof genreSearchSchema>;
