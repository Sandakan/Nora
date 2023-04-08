import path from 'path';
import log from '../log';
import parseFolderStructuresForSongPaths from '../fs/parseFolderForSongPaths';
import { parseSong } from '../parseSong';
import sortSongs from '../utils/sortSongs';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { generatePalettes } from '../other/generatePalette';

const addMusicFromFolderStructures = async (
  structures: FolderStructure[],
  resultsSortType?: SongSortTypes,
  abortSignal?: AbortSignal
): Promise<SongData[]> => {
  log('Started the process of linking a music folders to the library.');

  log(`Added new song folders to the app.`, {
    folderPaths: structures.map((x) => x.path),
  });
  const songPaths = await parseFolderStructuresForSongPaths(structures);
  console.time('parseTime');
  let songs: SongData[] = [];

  if (songPaths) {
    for (let i = 0; i < songPaths.length; i += 1) {
      if (abortSignal?.aborted) {
        log(
          'Parsing songs in music folders aborted by an abortController signal.',
          { reason: abortSignal?.reason },
          'WARN'
        );
        break;
      }

      const songPath = songPaths[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        const data = await parseSong(songPath, i >= 10);
        sendMessageToRenderer(
          `${i + 1} completed out of ${songPaths.length} songs.`,
          'AUDIO_PARSING_PROCESS_UPDATE',
          { max: songPaths.length, value: i + 1 }
        );
        if (data) songs.push(data);
      } catch (error) {
        log(
          `Error occurred when parsing '${path.basename(songPath)}'.`,
          { error },
          'WARN'
        );
      }
    }
    setTimeout(generatePalettes, 1500);
  } else throw new Error('Failed to get song paths from music folders.');

  if (resultsSortType) songs = sortSongs(songs, resultsSortType);

  log(
    `Successfully parsed ${songs.length} songs from the selcted music folders.`,
    {
      folderPaths: structures.map((x) => x.path),
      timeElapsed: console.timeEnd('parseTime'),
    }
  );
  dataUpdateEvent('userData/musicFolder');
  return songs;
};

export default addMusicFromFolderStructures;
