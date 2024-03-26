/* eslint-disable no-await-in-loop */
import path from 'path';
import { closeAbortController, saveAbortController } from '../fs/controlAbortControllers';
import { getSongsData, getUserData, setUserData } from '../filesystem';
import log from '../log';
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
    log(`Folder ${path.basename(folderPath)} removed successfully.`, {
      folderPath
    });
  }

  return musicFolders;
};

const removeMusicFolder = async (folderPath: string): Promise<boolean> => {
  log(`STARTED THE PROCESS OF REMOVING '${folderPath}' FROM THE SYSTEM.`, undefined, 'WARN');
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
      log(
        `${relatedFolderPaths.length} sub-directories found inside the '${pathBaseName}' directory. ${songPathsRelatedToFolders.length} files inside these directories will be deleted too.`,
        { subDirectories: relatedFolderPaths }
      );

      if (songPathsRelatedToFolders) {
        try {
          await removeSongsFromLibrary(songPathsRelatedToFolders, abortController.signal);
          log(`Deleted ${pathBaseName} folder from the filesystem.\nDIRECTORY : ${folderPath}`);
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
          log(
            `ERROR OCCURRED WHEN TRYING TO REMOVE SONG FROM A MUSIC FOLDER  `,
            { error },
            'ERROR'
          );
        }
      }
    }

    const updatedMusicFolders = removeFoldersFromStructure(relatedFolderPaths);

    setUserData('musicFolders', updatedMusicFolders);
    closeAbortController(folderPath);

    log(`Deleted ${relatedFolderPaths.length} directories.`, {
      relatedFolders: relatedFolderPaths
    });
    return true;
  }
  return false;
};

export default removeMusicFolder;
