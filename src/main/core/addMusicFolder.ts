import path from 'path';
import log from '../log';
import parseFolderStructuresForSongPaths, {
  doesFolderExistInFolderStructure,
} from '../fs/parseFolderStructuresForSongPaths';
import { tryToParseSong } from '../parseSong/parseSong';
import sortSongs from '../utils/sortSongs';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { generatePalettes } from '../other/generatePalette';
import { timeEnd, timeStart } from '../utils/measureTimeUsage';

const removeAlreadyAvailableStructures = (structures: FolderStructure[]) => {
  const parents: FolderStructure[] = [];
  for (const structure of structures) {
    const doesParentStructureExist = doesFolderExistInFolderStructure(
      structure.path,
    );

    if (doesParentStructureExist) {
      if (structure.subFolders.length > 0) {
        const subFolders = removeAlreadyAvailableStructures(
          structure.subFolders,
        );
        parents.push(...subFolders);
      }
    } else {
      const subFolders = removeAlreadyAvailableStructures(structure.subFolders);
      parents.push({ ...structure, subFolders });
    }
  }
  return parents;
};

const addMusicFromFolderStructures = async (
  structures: FolderStructure[],
  resultsSortType?: SongSortTypes,
  abortSignal?: AbortSignal,
): Promise<SongData[]> => {
  log('Started the process of linking a music folders to the library.');

  log(`Added new song folders to the app.`, {
    folderPaths: structures.map((x) => x.path),
  });

  const eligableStructures = removeAlreadyAvailableStructures(structures);
  const songPaths = await parseFolderStructuresForSongPaths(eligableStructures);

  console.time('parseTime');

  let songs: SongData[] = [];

  if (songPaths) {
    const startTime = timeStart();
    for (let i = 0; i < songPaths.length; i += 1) {
      if (abortSignal?.aborted) {
        log(
          'Parsing songs in music folders aborted by an abortController signal.',
          { reason: abortSignal?.reason },
          'WARN',
        );
        break;
      }

      const songPath = songPaths[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        const data = await tryToParseSong(songPath, false, false, i >= 10);
        sendMessageToRenderer(
          `${i + 1} completed out of ${songPaths.length} songs.`,
          'AUDIO_PARSING_PROCESS_UPDATE',
          { max: songPaths.length, value: i + 1 },
        );
        if (data) songs.push(data);
      } catch (error) {
        log(
          `Error occurred when parsing '${path.basename(songPath)}'.`,
          { error },
          'WARN',
        );
      }
    }
    timeEnd(startTime, 'Time to parse the whole folder');
    setTimeout(generatePalettes, 1500);
  } else throw new Error('Failed to get song paths from music folders.');

  if (resultsSortType) songs = sortSongs(songs, resultsSortType);

  log(
    `Successfully parsed ${songs.length} songs from the selected music folders.`,
    {
      folderPaths: eligableStructures.map((x) => x.path),
    },
  );
  dataUpdateEvent('userData/musicFolder');
  return songs;
};

export default addMusicFromFolderStructures;
