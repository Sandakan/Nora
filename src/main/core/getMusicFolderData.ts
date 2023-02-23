import sortFolders from '../utils/sortFolders';
import { getBlacklistData, getSongsData, getUserData } from '../filesystem';

const getMusicFolderData = (
  folderPaths: string[] = [],
  sortType?: FolderSortTypes
) => {
  const userData = getUserData();
  const songs = getSongsData();

  if (userData) {
    const { musicFolders } = userData;
    const { folderBlacklist } = getBlacklistData();
    const isSongsAvailable = songs.length > 0;

    if (Array.isArray(musicFolders) && musicFolders?.length > 0) {
      const audioFolders =
        folderPaths.length === 0
          ? musicFolders
          : musicFolders.filter((folder) => folderPaths.includes(folder.path));

      const folders: MusicFolder[] = audioFolders.map((folderData) => {
        const songIds: string[] = [];
        if (isSongsAvailable) {
          for (let i = 0; i < songs.length; i += 1) {
            const song = songs[i];

            if (song.path.includes(folderData.path)) songIds.push(song.songId);
          }
        }
        return {
          folderData,
          songIds,
          isBlacklisted: folderBlacklist.includes(folderData.path),
        };
      });

      if (sortType) return sortFolders(folders, sortType);
      return folders;
    }
  }
  return [];
};

export default getMusicFolderData;
