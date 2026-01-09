import { getArtistFavoriteStatus, updateArtistFavoriteStatus } from '@main/db/queries/artists';
import logger from '../logger';
import { dataUpdateEvent } from '../main';
import { db } from '@main/db/db';

// const dislikeArtist = (artist: SavableArtist) => {
//   artist.isAFavorite = false;
//   // result.success = true;
//   sendMessageToRenderer({
//     messageCode: 'ARTIST_DISLIKE',
//     data: {
//       name: artist.name.length > 20 ? `${artist.name.substring(0, 20).trim()}...` : artist.name,
//       artworkPath: getArtistArtworkPath(artist.artworkName),
//       onlineArtworkPaths: artist.onlineArtworkPaths
//     }
//   });
//   return artist;
// };

// const likeArtist = (artist: SavableArtist) => {
//   artist.isAFavorite = true;
//   // result.success = true;
//   sendMessageToRenderer({
//     messageCode: 'ARTIST_LIKE',
//     data: {
//       name: artist.name.length > 20 ? `${artist.name.substring(0, 20).trim()}...` : artist.name,
//       artworkPath: getArtistArtworkPath(artist.artworkName),
//       onlineArtworkPaths: artist.onlineArtworkPaths
//     }
//   });
//   return artist;
// };

const toggleLikeArtists = async (artistIds: number[], isLikeArtist?: boolean) => {
  const artists = await getArtistFavoriteStatus(artistIds);
  const result: ToggleLikeSongReturnValue = {
    likes: [],
    dislikes: []
  };

  logger.debug(
    `Requested to ${
      isLikeArtist === undefined ? 'toggle like' : isLikeArtist ? 'like' : 'dislike'
    } artists with ids -${artistIds.join(', ')}-`
  );
  if (artists.length > 0) {
    const favoriteGroupedArtists = Object.groupBy(artists, (artist) =>
      artist.isFavorite ? 'favorite' : 'notFavorite'
    );

    await db.transaction(async (trx) => {
      if (favoriteGroupedArtists.favorite) {
        const status = isLikeArtist ?? false;

        const dislikedArtistIds = favoriteGroupedArtists.favorite.map((a) => a.id);

        await updateArtistFavoriteStatus(dislikedArtistIds, status, trx);

        result.dislikes.push(...dislikedArtistIds);
      }

      if (favoriteGroupedArtists.notFavorite) {
        const status = isLikeArtist ?? true;

        const likedArtistIds = favoriteGroupedArtists.notFavorite.map((a) => a.id);

        await updateArtistFavoriteStatus(likedArtistIds, status, trx);

        result.likes.push(...likedArtistIds);
      }
    });

    dataUpdateEvent('artists/likes', [...result.likes, ...result.dislikes]);
    return result;
  }
  return result;
};

export default toggleLikeArtists;
