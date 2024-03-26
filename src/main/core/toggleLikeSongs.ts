import {
  addAFavoriteToLastFM,
  removeAFavoriteFromLastFM
} from '../other/lastFm/sendFavoritesDataToLastFM';
import { getSongsData, setSongsData } from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import addToFavorites from './addToFavorites';
import removeFromFavorites from './removeFromFavorites';

const likeTheSong = (song: SavableSongData, preventLogging = false) => {
  if (!song.isAFavorite) {
    addToFavorites(song.songId);

    const songArtists = song.artists?.map((artist) => artist.name);
    addAFavoriteToLastFM(song.title, songArtists);

    if (!preventLogging)
      sendMessageToRenderer({
        messageCode: 'SONG_LIKE',
        data: {
          name: song.title.length > 20 ? `${song.title.substring(0, 20).trim()}...` : song.title,
          artworkPath: getSongArtworkPath(song.songId, song.isArtworkAvailable).artworkPath
        }
      });
    song.isAFavorite = true;
    return song;
  }
  return undefined;
};

const dislikeTheSong = (song: SavableSongData, preventLogging = false) => {
  if (song.isAFavorite) {
    song.isAFavorite = false;
    removeFromFavorites(song.songId);

    const songArtists = song.artists?.map((artist) => artist.name);
    removeAFavoriteFromLastFM(song.title, songArtists);

    if (!preventLogging)
      sendMessageToRenderer({
        messageCode: 'SONG_DISLIKE',
        data: {
          name: song.title.length > 20 ? `${song.title.substring(0, 20).trim()}...` : song.title,
          artworkPath: getSongArtworkPath(song.songId, song.isArtworkAvailable).artworkPath
        }
      });
    return song;
  }
  return undefined;
};

const toggleLikeSongs = async (songIds: string[], isLikeSong?: boolean) => {
  const songs = getSongsData();
  const result: ToggleLikeSongReturnValue = {
    likes: [],
    dislikes: []
  };

  log(
    `Requested to ${
      isLikeSong !== undefined ? (isLikeSong ? 'like' : 'dislike') : 'toggle like'
    } ${songIds.length} songs.`
  );

  if (songs.length > 0) {
    const preventNotifications = songIds.length > 5;

    const updatedSongs = songs.map((song) => {
      const isSongIdAvailable = songIds.includes(song.songId);

      if (isSongIdAvailable) {
        if (isLikeSong === undefined) {
          if (song.isAFavorite) {
            const dislikedSongData = dislikeTheSong(song, preventNotifications);
            if (dislikedSongData) {
              result.dislikes.push(song.songId);
              return dislikedSongData;
            }
            return song;
          }
          const likedSongData = likeTheSong(song, preventNotifications);
          if (likedSongData) {
            result.likes.push(song.songId);
            return likedSongData;
          }
          return song;
        }
        if (isLikeSong) {
          const likedSongData = likeTheSong(song, preventNotifications);
          if (likedSongData) {
            result.likes.push(song.songId);
            return likedSongData;
          }
          return song;
        }
        const dislikedSongData = dislikeTheSong(song, preventNotifications);
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
