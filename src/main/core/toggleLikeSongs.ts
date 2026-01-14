import logger from '../logger';
import { dataUpdateEvent } from '../main';
import { db } from '@main/db/db';
import { getSongFavoriteStatuses, updateSongFavoriteStatuses } from '@main/db/queries/songs';

const toggleLikeSongs = async (songIds: number[], isLikeSong?: boolean) => {
  const songStatuses = await getSongFavoriteStatuses(songIds);

  const result: ToggleLikeSongReturnValue = {
    likes: [],
    dislikes: []
  };

  logger.info(`Requested to like/dislike song(s).`, { songIds, isLikeSong });

  const likeGroupedSongData = Object.groupBy(songStatuses, (status) =>
    status.isFavorite ? 'liked' : 'notLiked'
  );

  await db.transaction(async (trx) => {
    if (isLikeSong !== undefined) {
      if (likeGroupedSongData.liked) {
        const dislikedSongIds = likeGroupedSongData.liked.map((status) => status.id);

        await updateSongFavoriteStatuses(dislikedSongIds, false, trx);

        result.dislikes.push(...dislikedSongIds);
      }

      if (likeGroupedSongData.notLiked) {
        const likedSongIds = likeGroupedSongData.notLiked.map((status) => status.id);

        await updateSongFavoriteStatuses(likedSongIds, true, trx);

        result.likes.push(...likedSongIds);
      }
    } else {
      await updateSongFavoriteStatuses(songIds, isLikeSong!, trx);
    }
  });

  dataUpdateEvent('songs/likes', [...result.likes, ...result.dislikes]);
  return result;
};

export default toggleLikeSongs;
