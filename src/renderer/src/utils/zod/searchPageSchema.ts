import { searchFilterTypes } from '@renderer/components/SearchPage/SearchOptions';
import { z } from 'zod';

export const searchPageSchema = z.object({
  keyword: z.string().optional().default(''),
  isSimilaritySearchEnabled: z.boolean().optional(),
  filterBy: z.enum(searchFilterTypes).optional().default('All')
});
