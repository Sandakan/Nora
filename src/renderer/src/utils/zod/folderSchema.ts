import { z } from 'zod';
import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';
import { folderSortTypes } from '@renderer/components/MusicFoldersPage/folderOptions';

export const folderSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(folderSortTypes).optional()
});

export type FolderSearchSchema = z.infer<typeof folderSearchSchema>;
