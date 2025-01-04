import path from 'path';
import { closeAbortController, saveAbortController } from '../fs/controlAbortControllers';
import { getSongsData, getUserData, setUserData } from '../filesystem';
import logger from '../logger';
import { sendMessageToRenderer } from '../main';
import removeSongsFromLibrary from '../removeSongsFromLibrary';
import { getAllFoldersFromFolderStructures } from '../fs/parseFolderStructuresForSongPaths';

const abortController = new AbortController();
saveAbortController('removeMusicFolder', abortController);

const getSongPathsRelatedToFolders = (folderPaths: string[]) => {
  const songs = getSongsData();
  const songPaths = songs.map((song) => song.path);
  const songPathsRelatedToFolders = songPaths.filter((songPath) =>
    folderPaths.some((folderPath) => songPath.includes(folderPath))
  );
  return songPathsRelatedToFolders;
};

const removeFolderFromStructure = (
  folderPath: string,
  removeSubDirs = false,
  musicFolders: FolderStructure[]
) => {
  const updatedMusicFolders = musicFolders.filter((folder) => {
    if (folder.path === folderPath) {
      if (!removeSubDirs) musicFolders.push(...folder.subFolders);
      return false;
    }
    if (folderPath.includes(folder.path)) {
      const updatedSubFolders = removeFolderFromStructure(
        folderPath,
        removeSubDirs,
        folder.subFolders
      );
      folder.subFolders = updatedSubFolders;
    }
    return true;
  });

  return updatedMusicFolders;
};

const removeFoldersFromStructure = (folderPaths: string[]) => {
  let musicFolders = [...getUserData().musicFolders];

  for (const folderPath of folderPaths) {
    musicFolders = removeFolderFromStructure(folderPath, undefined, musicFolders);
    logger.info(`Folder removed successfully.`, { folderPath });
  }

  return musicFolders;
};

const removeMusicFolder = async (folderPath: string): Promise<boolean> => {
  logger.debug(`Started the process of removing a folder from the library.`, { folderPath });

  const pathBaseName = path.basename(folderPath);
  const { musicFolders } = getUserData();
  const folders = getAllFoldersFromFolderStructures(musicFolders);
  const isFolderAvialable = folders.some((folder) => folder.path === folderPath);

  if (Array.isArray(folders) && folders.length > 0 && isFolderAvialable) {
    const folderPaths = folders.map((folder) => folder.path);
    const relatedFolderPaths = folderPaths.filter((relatedFolderPath) =>
      relatedFolderPath.includes(folderPath)
    );
    if (relatedFolderPaths.length > 0) {
      const songPathsRelatedToFolders = getSongPathsRelatedToFolders(relatedFolderPaths);
      logger.debug(
        `${relatedFolderPaths.length} sub-directories found inside the '${pathBaseName}' directory. ${songPathsRelatedToFolders.length} files inside these directories will be deleted too.`,
        {
          subDirectories: relatedFolderPaths,
          pathBaseName,
          songCount: songPathsRelatedToFolders.length
        }
      );

      if (songPathsRelatedToFolders) {
        try {
          await removeSongsFromLibrary(songPathsRelatedToFolders, abortController.signal);
          logger.debug(`Deleted folder from the library`, {
            folderPath,
            songPathsRelatedToFoldersCount: songPathsRelatedToFolders.length
          });
          sendMessageToRenderer({
            messageCode:
              songPathsRelatedToFolders.length > 0
                ? 'MUSIC_FOLDER_DELETED'
                : 'EMPTY_MUSIC_FOLDER_DELETED',
            data: {
              name: pathBaseName,
              count: songPathsRelatedToFolders.length
            }
          });
        } catch (error) {
          logger.error(`Failed to delete folder from the library.`, { error, folderPath });
        }
      }
    }

    const updatedMusicFolders = removeFoldersFromStructure(relatedFolderPaths);

    setUserData('musicFolders', updatedMusicFolders);
    closeAbortController(folderPath);

    logger.debug(`Deleted ${relatedFolderPaths.length} directories.`, {
      relatedFolders: relatedFolderPaths
    });
    return true;
  }
  return false;
};

export default removeMusicFolder;
