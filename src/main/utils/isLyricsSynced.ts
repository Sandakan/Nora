export const syncedLyricsRegex =
  /^(\[(?:la:)?(?<lang>\w{2,3})])?(?<timestamp>\[\d+:\d{1,2}\.\d{1,3}])(\[(?:la:)?(?:\w{2,3})])?(?=(?<lyric>.+$))/gm;

const isLyricsSynced = (lyrics: string) => syncedLyricsRegex.test(lyrics);

export default isLyricsSynced;
