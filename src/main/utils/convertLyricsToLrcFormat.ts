const convertLyricsToLrcFormat = (songLyrics: SongLyrics) => {
  // const { title, lyrics } = songLyrics;
  // const output: string[] = [];

  // output.push(`[ti:${title}]`);
  // output.push(`[length:${min}:${sec}]`);

  //   if (artists && artists?.length > 0)
  //     metadataLines.push(`[ar:${artists.map((x) => x.name).join(', ')}]`);
  //   if (album) metadataLines.push(`[al:${album.name}]`);
  //   metadataLines.push('');

  // const unparsedLines = lyrics.unparsedLyrics.split('\n');
  // output.push(...unparsedLines);

  return songLyrics.lyrics.unparsedLyrics;
};

export default convertLyricsToLrcFormat;
