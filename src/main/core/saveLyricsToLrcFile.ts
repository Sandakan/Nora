import path from 'path';
import fs from 'fs/promises';

import log from '../log';
import { getUserData } from '../filesystem';

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

const getLrcFileSaveDirectory = (songPathWithoutProtocol: string, lrcFileName: string) => {
  const userData = getUserData();
  const extensionDroppedLrcFileName = lrcFileName.replaceAll(path.extname(lrcFileName), '');
  let saveDirectory: string;

  if (userData.customLrcFilesSaveLocation) saveDirectory = userData.customLrcFilesSaveLocation;
  else {
    const songContainingFolderPath = path.dirname(songPathWithoutProtocol);
    saveDirectory = songContainingFolderPath;
  }

  return path.join(saveDirectory, `${extensionDroppedLrcFileName}.lrc`);
};

const saveLyricsToLRCFile = async (songPathWithoutProtocol: string, songLyrics: SongLyrics) => {
  const songFileName = path.basename(songPathWithoutProtocol);
  const lrcFilePath = getLrcFileSaveDirectory(songPathWithoutProtocol, songFileName);

  const lrcFormattedLyrics = convertLyricsToLrcFormat(songLyrics);

  await fs.writeFile(lrcFilePath, lrcFormattedLyrics);
  log(`Lyrics saved in ${lrcFilePath}.`, { title: songLyrics.title });
};

export default saveLyricsToLRCFile;
