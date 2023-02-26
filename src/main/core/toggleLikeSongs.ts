import { getSongsData, setSongsData } from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import addToFavorites from './addToFavorites';
import removeFromFavorites from './removeFromFavorites';

const likeTheSong = (song: SavableSongData) => {
  if (!song.isAFavorite) {
    addToFavorites(song.songId);
    sendMessageToRenderer(
      `'${
        song.title.length > 20
          ? `${song.title.substring(0, 20).trim()}...`
          : song.title
      }' added to Favorites.`,
      'SONG_LIKE',
      {
        artworkPath: getSongArtworkPath(song.songId, song.isArtworkAvailable)
          .artworkPath,
      }
    );
    song.isAFavorite = true;
    return song;
  }
  return undefined;
};

const dislikeTheSong = (song: SavableSongData) => {
  if (song.isAFavorite) {
    song.isAFavorite = false;
    removeFromFavorites(song.songId);
    sendMessageToRenderer(
      `'${
        song.title.length > 20
          ? `${song.title.substring(0, 20).trim()}...`
          : song.title
      }' removed from the Favorites.`,
      'SONG_DISLIKE',
      {
        artworkPath: getSongArtworkPath(song.songId, song.isArtworkAvailable)
          .artworkPath,
      }
    );
    return song;
  }
  return undefined;
};

const toggleLikeSongs = async (songIds: string[], isLikeSong?: boolean) => {
  const songs = getSongsData();
  const result: ToggleLikeSongReturnValue = {
    likes: [],
    dislikes: [],
  };
  log(
    `Requested to ${
      isLikeSong !== undefined
        ? isLikeSong
          ? 'like'
          : 'dislike'
        : 'toggle like'
    } ${songIds.length} songs.`,
    { songIds }
  );
  if (songs.length > 0) {
    const updatedSongs = songs.map((song) => {
      const isSongIdAvailable = songIds.includes(song.songId);

      if (isSongIdAvailable) {
        if (isLikeSong === undefined) {
          if (song.isAFavorite) {
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
        if (isLikeSong) {
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
      }
      return song;
    });

    setSongsData(updatedSongs);
    dataUpdateEvent('songs/likes', [...result.likes, ...result.dislikes]);
    return result;
  }
  return result;
};

export default toggleLikeSongs;
