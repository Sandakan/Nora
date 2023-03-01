import log from '../log';
import { getBlacklistData } from '../filesystem';
import { dataUpdateEvent } from '../main';

const toggleBlacklistFolders = async (
  folderPaths: string[],
  isBlacklistFolder?: boolean
) => {
  const blacklist = getBlacklistData();

  log(
    `Requested to ${
      isBlacklistFolder !== undefined
        ? isBlacklistFolder
          ? 'blacklist'
          : 'whilelist'
        : 'toggle blacklist'
    } ${folderPaths.length} folders.`,
    { folderPaths }
  );

  const updatedSongs = folderPaths.map((folderPath) => {
    const isFolderBlacklisted = blacklist.folderBlacklist.includes(folderPath);

    if (isBlacklistFolder === undefined) {
      if (isFolderBlacklisted) {
        const dislikedSongData = dislikeTheSong(song);
        if (dislikedSongData) {
          result.dislikes.push(song.songId);
          return dislikedSongData;
        }
        return song;
      }
      const likedSongData = likeTheSong(song);
      if (likedSongData) {
        result.likes.push(song.songId);
        return likedSongData;
      }
      return song;
    }
    if (isBlacklistFolder) {
      const likedSongData = likeTheSong(song);
      if (likedSongData) {
        result.likes.push(song.songId);
        return likedSongData;
      }
      return song;
    }
    const dislikedSongData = dislikeTheSong(song);
    if (dislikedSongData) {
      result.dislikes.push(song.songId);
      return dislikedSongData;
    }
    return song;
  });

  setSongsData(updatedSongs);
  dataUpdateEvent('songs/likes', [...result.likes, ...result.dislikes]);
  return undefined;
};

export default toggleBlacklistFolders;
