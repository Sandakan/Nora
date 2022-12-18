export const syncedLyricsRegex = /^\[\d+:\d{1,2}\.\d{1,3}]/gm;

const isLyricsSynced = (lyrics: string) => syncedLyricsRegex.test(lyrics);

export default isLyricsSynced;
