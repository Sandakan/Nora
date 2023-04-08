/* eslint-disable no-await-in-loop */
import path from 'path';
import {
  closeAbortController,
  saveAbortController,
} from '../fs/controlAbortControllers';
import { getSongsData, getUserData, setUserData } from '../filesystem';
import log from '../log';
import { sendMessageToRenderer } from '../main';
import removeSongsFromLibrary from '../removeSongsFromLibrary';
import { getAllFoldersFromFolderStructures } from '../fs/parseFolderForSongPaths';

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
  folders?: FolderStructure[]
) => {
  const musicFolders = folders ?? getUserData().musicFolders;

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

const removeMusicFolder = async (folderPath: string): Promise<boolean> => {
  log(
    `STARTED THE PROCESS OF REMOVING '${folderPath}' FROM THE SYSTEM.`,
    undefined,
    'WARN'
  );
  const pathBaseName = path.basename(folderPath);
  const { musicFolders } = getUserData();
  const folders = getAllFoldersFromFolderStructures(musicFolders);
  const isFolderAvialable = folders.some(
    (folder) => folder.path === folderPath
  );

  if (Array.isArray(folders) && folders.length > 0 && isFolderAvialable) {
    const folderPaths = folders.map((folder) => folder.path);
    const relatedFolderPaths = folderPaths.filter((relatedFolderPath) =>
      relatedFolderPath.includes(folderPath)
    );
    if (relatedFolderPaths.length > 0) {
      const songPathsRelatedToFolders =
        getSongPathsRelatedToFolders(relatedFolderPaths);
      log(
        `${relatedFolderPaths.length} sub-directories found inside the '${pathBaseName}' directory. ${songPathsRelatedToFolders.length} files inside these directories will be deleted too.`,
        { subDirectories: relatedFolderPaths }
      );

      if (songPathsRelatedToFolders) {
        log(
          `User deleted ${pathBaseName} folder from the filesystem.\nDIRECTORY : ${folderPath}`
        );
        sendMessageToRenderer(
          `'${pathBaseName}' folder got deleted from the system. ${
            songPathsRelatedToFolders.length > 0
              ? `${songPathsRelatedToFolders.length} songs related to that folder will be removed from the library.`
              : 'No songs found related to the folder. Library will be unaffected.'
          }`,
          'MUSIC_FOLDER_DELETED',
          { path: folderPath }
        );

        try {
          await removeSongsFromLibrary(
            songPathsRelatedToFolders,
            abortController.signal
          );
        } catch (error) {
          log(
            `ERROR OCCURRED WHEN TRYING TO REMOVE SONG FROM A MUSIC FOLDER  `,
            { error },
            'ERROR'
          );
        }
      }
    }

    // TODO - relatedFolderPaths[0] => relatedFolderPaths
    const updatedMusicFolders = removeFolderFromStructure(
      relatedFolderPaths[0]
    );
    setUserData('musicFolders', updatedMusicFolders);
    closeAbortController(folderPath);

    log(`Deleted ${relatedFolderPaths.length} directories.`, {
      relatedFolders: relatedFolderPaths,
    });
    return true;
  }
  return false;
};

export default removeMusicFolder;
