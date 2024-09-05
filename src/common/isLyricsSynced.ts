export const syncedLyricsRegex =
  /^(\[(?:lang:)?(?<lang>\w{2,3})])?(?<timestamp>\[\d+:\d{1,2}\.\d{1,3}])(\[(?:lang:)?(?:\w{2,3})])?(?=(?<lyric>.+$))/gm;
export const extendedSyncedLyricsLineRegex =
  // eslint-disable-next-line no-useless-escape
  /(?<extSyncTimeStamp>[\[<]\d+:\d{1,2}\.\d{1,3}[\]>]) ?(?=(?<lyric>[^<>\n]+))/gm;
export const extendedSyncedLyricsRegex =
  /(?<extSyncTimeStamp><\d+:\d{1,2}\.\d{1,3}>) ?(?=(?<lyric>[^<>\n]+))/gm;

const isLyricsSynced = (lyrics: string) => {
  const bool = syncedLyricsRegex.test(lyrics);
  syncedLyricsRegex.lastIndex = 0;

  return bool;
};

export const isLyricsEnhancedSynced = (syncedLyricsString: string) => {
  const isEnhancedSynced = extendedSyncedLyricsRegex.test(syncedLyricsString);
  extendedSyncedLyricsRegex.lastIndex = 0;

  return isEnhancedSynced;
};

export const isAnExtendedSyncedLyricsLine = (line: string) => {
  const bool = extendedSyncedLyricsLineRegex.test(line);
  extendedSyncedLyricsLineRegex.lastIndex = 0;

  return bool;
};

export default isLyricsSynced;
