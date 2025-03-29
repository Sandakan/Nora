// matches unsynced, synced, or an enhanced synced lyrics line
export const LYRICS_LINE_REGEX =
  /^(?<timestamp>\[\d+:\d{1,2}\.\d{1,3}])?(\[(?:lang:)?(?<lang>\w{2,3})])?(?=(?<lyric>.+$))/gm;

export const SYNCED_LYRICS_REGEX =
  /^(\[(?:lang:)?(?<lang>\w{2,3})])?(?<timestamp>\[(?<sec>\d+):(?<ms>\d{1,2}\.\d{1,3})])(\[(?:lang:)?(?:\w{2,3})])?(?=(?<lyric>.+$))/gm;
export const EXTENDED_SYNCED_LYRICS_LINE_REGEX =
  /(?<extSyncTimeStamp>[\[<]\d+:\d{1,2}\.\d{1,3}[\]>]) ?(?=(?<lyric>[^<>\n]+))/gm;
export const EXTENDED_SYNCED_LYRICS_REGEX =
  /(?<extSyncTimeStamp><\d+:\d{1,2}\.\d{1,3}>) ?(?=(?<lyric>[^<>\n]+))/gm;

const isLyricsSynced = (lyrics: string) => {
  const bool = SYNCED_LYRICS_REGEX.test(lyrics);
  SYNCED_LYRICS_REGEX.lastIndex = 0;

  return bool;
};

export const isLyricsEnhancedSynced = (syncedLyricsString: string) => {
  const isEnhancedSynced = EXTENDED_SYNCED_LYRICS_REGEX.test(syncedLyricsString);
  EXTENDED_SYNCED_LYRICS_REGEX.lastIndex = 0;

  return isEnhancedSynced;
};

export const isAnExtendedSyncedLyricsLine = (line: string) => {
  const bool = EXTENDED_SYNCED_LYRICS_LINE_REGEX.test(line);
  EXTENDED_SYNCED_LYRICS_LINE_REGEX.lastIndex = 0;

  return bool;
};

export default isLyricsSynced;
