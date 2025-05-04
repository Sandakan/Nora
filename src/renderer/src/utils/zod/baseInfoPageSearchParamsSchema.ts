import { z } from 'zod';


export const baseInfoPageSearchParamsSchema = z.object({
    scrollTopOffset: z.number().optional().default(0),
});

export type BaseInfoPageSearchParams = z.infer<typeof baseInfoPageSearchParamsSchema>;
