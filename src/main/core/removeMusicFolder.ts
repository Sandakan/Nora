/* eslint-disable no-await-in-loop */
import path from 'path';
import { closeWatcher } from '../fs/controlWatcherFunctions';
import { getSongsData, getUserData, setUserData } from '../filesystem';
import log from '../log';
import { sendMessageToRenderer } from '../main';
import removeSongsFromLibrary from '../removeSongsFromLibrary';

const getSongPathsRelatedToFolders = (folderPaths: string[]) => {
  const songs = getSongsData();
  const songPaths = songs.map((song) => song.path);
  const songPathsRelatedToFolders = songPaths.filter((songPath) =>
    folderPaths.some((folderPath) => songPath.includes(folderPath))
  );
  return songPathsRelatedToFolders;
};

const removeMusicFolder = async (folderPath: string): Promise<boolean> => {
  log(
    `STARTED THE PROCESS OF REMOVING '${folderPath}' FROM THE SYSTEM.`,
    undefined,
    'WARN'
  );
  const pathBaseName = path.basename(folderPath);
  const { musicFolders } = getUserData();
  if (
    Array.isArray(musicFolders) &&
    musicFolders.length > 0 &&
    musicFolders.some((folder) => folder.path === folderPath)
  ) {
    const folderPaths = musicFolders.map((folder) => folder.path);
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
          `User deleted ${path.basename(
            folderPath
          )} folder from the filesystem.\nDIRECTORY : ${folderPath}`
        );
        sendMessageToRenderer(
          `'${path.basename(folderPath)}' folder got deleted from the system. ${
            songPathsRelatedToFolders.length > 0
              ? `${songPathsRelatedToFolders.length} songs related to that folder will be removed from the library.`
              : 'No songs found related to the folder. Library will be unaffected.'
          }`,
          'MUSIC_FOLDER_DELETED',
          { path: folderPath }
        );

        try {
          await removeSongsFromLibrary(songPathsRelatedToFolders, false);
        } catch (error) {
          log(
            `ERROR OCCURRED WHEN TRYING TO REMOVE SONG FROM A MUSIC FOLDER  `,
            { error },
            'ERROR'
          );
        }
      }
    }

    const updatedMusicFolders = musicFolders.filter(
      (folder) => !relatedFolderPaths.some((x) => x === folder.path)
    );

    setUserData('musicFolders', updatedMusicFolders);
    closeWatcher(folderPath);
    log(`Deleted ${relatedFolderPaths.length} directories.`, {
      relatedFolders: relatedFolderPaths,
    });
    return true;
  }
  return false;
};

export default removeMusicFolder;
