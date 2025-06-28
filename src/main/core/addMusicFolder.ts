import path from 'path';
import logger from '../logger';
import parseFolderStructuresForSongPaths, {
  doesFolderExistInFolderStructure
} from '../fs/parseFolderStructuresForSongPaths';
import { tryToParseSong } from '../parseSong/parseSong';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { generatePalettes } from '../other/generatePalette';
import { timeEnd, timeStart } from '../utils/measureTimeUsage';

const removeAlreadyAvailableStructures = async (structures: FolderStructure[]) => {
  const parents: FolderStructure[] = [];
  for (const structure of structures) {
    const doesParentStructureExist = await doesFolderExistInFolderStructure(structure.path);

    if (doesParentStructureExist) {
      if (structure.subFolders.length > 0) {
        const subFolders = await removeAlreadyAvailableStructures(structure.subFolders);
        parents.push(...subFolders);
      }
    } else {
      const subFolders = await removeAlreadyAvailableStructures(structure.subFolders);
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

  const eligableStructures = await removeAlreadyAvailableStructures(structures);
  const songPathsData = await parseFolderStructuresForSongPaths(eligableStructures);

  if (songPathsData) {
    const startTime = timeStart();
    for (let i = 0; i < songPathsData.length; i += 1) {
      if (abortSignal?.aborted) {
        logger.warn('Parsing songs in music folders aborted by an abortController signal.', {
          reason: abortSignal?.reason
        });
        break;
      }

      const songPathData = songPathsData[i];
      try {
        await tryToParseSong(songPathData.songPath, songPathData.folder.id, false, false, i >= 10);
        sendMessageToRenderer({
          messageCode: 'AUDIO_PARSING_PROCESS_UPDATE',
          data: { total: songPathsData.length, value: i + 1 }
        });
      } catch (error) {
        logger.error(`Failed to parse '${path.basename(songPathData.songPath)}'.`, {
          error,
          songPath: songPathData.songPath
        });
      }
    }
    timeEnd(startTime, 'Time to parse the whole folder');
    setTimeout(generatePalettes, 1500);
  } else throw new Error('Failed to get song paths from music folders.');

  logger.debug(
    `Successfully parsed ${songPathsData.length} songs from the selected music folders.`,
    {
      folderPaths: eligableStructures.map((x) => x.path)
    }
  );
  dataUpdateEvent('userData/musicFolder');
};

export default addMusicFromFolderStructures;
