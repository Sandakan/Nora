import { getArtistsData, setArtistsData } from '../filesystem';
import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';

const dislikeArtist = (artist: SavableArtist) => {
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
    },
  );
  return artist;
};

const likeArtist = (artist: SavableArtist) => {
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
    },
  );
  return artist;
};

const toggleLikeArtists = async (
  artistIds: string[],
  isLikeArtist?: boolean,
) => {
  const artists = getArtistsData();
  const result: ToggleLikeSongReturnValue = {
    likes: [],
    dislikes: [],
  };

  log(
    `Requested to ${
      isLikeArtist === undefined
        ? 'toggle like'
        : isLikeArtist
        ? 'like'
        : 'dislike'
    } artists with ids -${artistIds.join(', ')}-`,
  );
  if (artists.length > 0) {
    const updatedArtists = artists.map((artist) => {
      if (artistIds.includes(artist.artistId)) {
        if (artist.isAFavorite) {
          if (isLikeArtist !== true) {
            const updatedArtist = dislikeArtist(artist);
            result.dislikes.push(updatedArtist.artistId);
            return updatedArtist;
          }
          log(
            `Tried to like an artist with a artist id -${artist.artistId}- that has been already been liked.`,
          );
          return artist;
        }

        if (isLikeArtist !== false) {
          const updatedArtist = likeArtist(artist);
          result.likes.push(updatedArtist.artistId);
          return updatedArtist;
        }
        log(
          `Tried to dislike an artist with a artist id -${artist.artistId}- that has been already been disliked.`,
        );
        return artist;
      }
      return artist;
    });
    setArtistsData(updatedArtists);
    dataUpdateEvent('artists/likes', [...result.likes, ...result.dislikes]);
    return result;
  }
  return result;
};

export default toggleLikeArtists;
