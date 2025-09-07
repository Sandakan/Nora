import logger from '../logger';
import { dataUpdateEvent } from '../main';
import {
  getFavoritesPlaylist,
  linkSongsWithPlaylist,
  unlinkSongsFromPlaylist
} from '@main/db/queries/playlists';
import { db } from '@main/db/db';

const toggleLikeSongs = async (songIds: string[], isLikeSong?: boolean) => {
  const favoritesPlaylist = await getFavoritesPlaylist();

  if (!favoritesPlaylist) {
    logger.error('Favorites playlist not found while toggling like songs.');
    return;
  }

  const likedSongIds = favoritesPlaylist.songs.map((s) => s.songId) || [];

  const result: ToggleLikeSongReturnValue = {
    likes: [],
    dislikes: []
  };

  logger.info(`Requested to like/dislike song(s).`, { songIds, isLikeSong });

  const likeGroupedSongIds = Object.groupBy(songIds, (id) =>
    likedSongIds.includes(Number(id)) ? 'liked' : 'notLiked'
  );

  await db.transaction(async (trx) => {
    if (likeGroupedSongIds.liked) {
      const dislikedSongIds = likeGroupedSongIds.liked.map((id) => Number(id));

      await unlinkSongsFromPlaylist(dislikedSongIds, favoritesPlaylist.id, trx);

      result.dislikes.push(...dislikedSongIds.map((id) => id.toString()));
    }

    if (likeGroupedSongIds.notLiked) {
      const likedSongIds = likeGroupedSongIds.notLiked.map((id) => Number(id));

      await linkSongsWithPlaylist(likedSongIds, favoritesPlaylist.id, trx);

      result.likes.push(...likedSongIds.map((id) => id.toString()));
    }
  });

  dataUpdateEvent('songs/likes', [...result.likes, ...result.dislikes]);
  return result;
};

export default toggleLikeSongs;
