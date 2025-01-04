import path from 'path';
import logger from '../logger';
import parseFolderStructuresForSongPaths, {
  doesFolderExistInFolderStructure
} from '../fs/parseFolderStructuresForSongPaths';
import { tryToParseSong } from '../parseSong/parseSong';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { generatePalettes } from '../other/generatePalette';
import { timeEnd, timeStart } from '../utils/measureTimeUsage';

const removeAlreadyAvailableStructures = (structures: FolderStructure[]) => {
  const parents: FolderStructure[] = [];
  for (const structure of structures) {
    const doesParentStructureExist = doesFolderExistInFolderStructure(structure.path);

    if (doesParentStructureExist) {
      if (structure.subFolders.length > 0) {
        const subFolders = removeAlreadyAvailableStructures(structure.subFolders);
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
  abortSignal?: AbortSignal
) => {
  logger.debug('Started the process of linking a music folders to the library.');

  logger.info(`Added new song folders to the app.`, {
    folderPaths: structures.map((x) => x.path)
  });

  const eligableStructures = removeAlreadyAvailableStructures(structures);
  const songPaths = await parseFolderStructuresForSongPaths(eligableStructures);

  if (songPaths) {
    const startTime = timeStart();
    for (let i = 0; i < songPaths.length; i += 1) {
      if (abortSignal?.aborted) {
        logger.warn('Parsing songs in music folders aborted by an abortController signal.', {
          reason: abortSignal?.reason
        });
        break;
      }

      const songPath = songPaths[i];
      try {
        await tryToParseSong(songPath, false, false, i >= 10);
        sendMessageToRenderer({
          messageCode: 'AUDIO_PARSING_PROCESS_UPDATE',
          data: { total: songPaths.length, value: i + 1 }
        });
      } catch (error) {
        logger.error(`Failed to parse '${path.basename(songPath)}'.`, { error, songPath });
      }
    }
    timeEnd(startTime, 'Time to parse the whole folder');
    setTimeout(generatePalettes, 1500);
  } else throw new Error('Failed to get song paths from music folders.');

  logger.debug(`Successfully parsed ${songPaths.length} songs from the selected music folders.`, {
    folderPaths: eligableStructures.map((x) => x.path)
  });
  dataUpdateEvent('userData/musicFolder');
};

export default addMusicFromFolderStructures;
