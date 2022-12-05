const isLyricsSynced = (lyrics: string) =>
  /^\[\d+:\d{1,2}\.\d{1,2}]/gm.test(lyrics);

export default isLyricsSynced;
