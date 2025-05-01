import { songSortTypes } from '@renderer/components/SongsPage/SongOptions';
import { z } from 'zod';


export const baseInfoPageSearchParamsSchema = z.object({
    scrollTopOffset: z.number().optional().default(0),
    sortingOrder: z.enum(songSortTypes).optional(),
});

export type BaseInfoPageSearchParams = z.infer<typeof baseInfoPageSearchParamsSchema>;
