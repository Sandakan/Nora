export const VALID_PERIODS = ['overall', '7day', '1month', '3month', '6month', '12month'] as const;
export type ValidPeriod = (typeof VALID_PERIODS)[number];

export const MAX_LIMIT = 100;
export const MAX_LASTFM_MATCH_IDS = 100;
