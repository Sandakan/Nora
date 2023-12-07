import path from 'path';

import { generateRandomId } from '../utils/randomId';

const manageAlbumArtistOfParsedSong = (
  allArtists: SavableArtist[],
  songInfo: SavableSongData,
  songArtworkPaths?: ArtworkPaths,
  relevantAlbum?: SavableAlbum,
) => {
  const newAlbumArtists: SavableArtist[] = [];
  const relevantAlbumArtists: SavableArtist[] = [];
  const { title, songId, albumArtists } = songInfo;

  if (Array.isArray(allArtists)) {
    if (albumArtists && albumArtists.length > 0) {
      for (const albumArtist of albumArtists) {
        const albumArtistName = albumArtist.name.trim();

        const availableAlbumArtist = allArtists.find(
          (artist) => artist.name === albumArtistName,
        );

        if (availableAlbumArtist) {
          if (relevantAlbum) {
            const isAlbumLinkedToArtist = availableAlbumArtist.albums?.some(
              (album) => album.albumId === relevantAlbum.albumId,
            );

            if (!isAlbumLinkedToArtist)
              availableAlbumArtist.albums?.push({
                title: relevantAlbum.title,
                albumId: relevantAlbum.albumId,
              });
          }
          relevantAlbumArtists.push(availableAlbumArtist);
        } else {
          const artist: SavableArtist = {
            name: albumArtistName,
            artistId: generateRandomId(),
            songs: [{ songId, title }],
            artworkName:
              songArtworkPaths && !songArtworkPaths.isDefaultArtwork
                ? path.basename(songArtworkPaths.artworkPath)
                : undefined,
            albums: relevantAlbum
              ? [
                  {
                    title: relevantAlbum.title,
                    albumId: relevantAlbum.albumId,
                  },
                ]
              : [],
            isAFavorite: false,
          };
          relevantAlbumArtists.push(artist);
          newAlbumArtists.push(artist);
          allArtists.push(artist);
        }
      }
    }
    return {
      updatedArtists: allArtists,
      newAlbumArtists,
      relevantAlbumArtists,
    };
  }
  return {
    updatedArtists: [],
    newAlbumArtists,
    relevantAlbumArtists,
  };
};

export default manageAlbumArtistOfParsedSong;
