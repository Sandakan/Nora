import { folderSortTypes } from '@renderer/components/MusicFoldersPage/folderOptions';
import { z } from 'zod';

import { baseInfoPageSearchParamsSchema } from './baseInfoPageSearchParamsSchema';

export const folderSearchSchema = baseInfoPageSearchParamsSchema.extend({
  sortingOrder: z.enum(folderSortTypes).optional()
});

export type FolderSearchSchema = z.infer<typeof folderSearchSchema>;
