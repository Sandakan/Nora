import { getArtistsData, setArtistsData } from '../filesystem';
import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';

const toggleLikeArtist = async (artistId: string, likeArtist: boolean) => {
  const artists = getArtistsData();
  const result: ToggleLikeSongReturnValue = {
    likes: 0,
    dislikes: 0,
  };
  log(
    `Requested to ${
      likeArtist ? 'like' : 'dislike'
    } an artist with id -${artistId}-`
  );
  if (artists.length > 0) {
    const updatedArtists = artists.map((artist) => {
      if (artist.artistId === artistId) {
        if (likeArtist) {
          if (artist.isAFavorite) {
            log(
              `Tried to like an artist that has been already been liked with a artist id -${artistId}-`
            );
            // result.error = `you have already liked ${artistId}`;
            return artist;
          }
          artist.isAFavorite = true;
          // result.success = true;
          sendMessageToRenderer(
            `You liked '${
              artist.name.length > 20
                ? `${artist.name.substring(0, 20).trim()}...`
                : artist.name
            }'`,
            'ARTIST_LIKE',
            {
              artworkPath: getArtistArtworkPath(artist.artworkName),
              onlineArtworkPaths: artist.onlineArtworkPaths,
            }
          );
          return artist;
        }
        if (artist.isAFavorite) {
          artist.isAFavorite = false;
          // result.success = true;
          sendMessageToRenderer(
            `You disliked '${
              artist.name.length > 20
                ? `${artist.name.substring(0, 20).trim()}...`
                : artist.name
            }'`,
            'ARTIST_DISLIKE',
            {
              artworkPath: getArtistArtworkPath(artist.artworkName),
              onlineArtworkPaths: artist.onlineArtworkPaths,
            }
          );
          return artist;
        }
        log(
          `Tried to dislike an artist that has been already been disliked with an artist id -${artistId}-`
        );
        // result.error = `you have already disliked ${artistId}`;
        return artist;
      }
      return artist;
    });
    setArtistsData(updatedArtists);
    dataUpdateEvent('artists/likes', artistId);
    return result;
  }
  return result;
};

export default toggleLikeArtist;
