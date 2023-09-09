import path from 'path';

import { generateRandomId } from '../utils/randomId';

const manageArtistsOfParsedSong = (
  allArtists: SavableArtist[],
  songInfo: SavableSongData,
  songArtworkPaths?: ArtworkPaths,
  relevantAlbums = [] as SavableAlbum[],
) => {
  // let updatedArtists = allArtists;
  const newArtists: SavableArtist[] = [];
  const relevantArtists: SavableArtist[] = [];
  const { title, songId, artists: songArtists } = songInfo;

  if (Array.isArray(allArtists)) {
    if (songArtists && songArtists.length > 0) {
      for (const newArtist of songArtists) {
        const newArtistName = newArtist.name.trim();

        const isArtistAvailable = allArtists.some(
          (artist) => artist.name === newArtistName,
        );

        if (isArtistAvailable) {
          for (const availableArtist of allArtists) {
            if (availableArtist.name === newArtistName) {
              availableArtist.songs.push({ title, songId });

              if (relevantAlbums.length > 0) {
                relevantAlbums.forEach((relevantAlbum) => {
                  const isAlbumLinkedToArtist = availableArtist.albums?.some(
                    (album) => album.albumId === relevantAlbum.albumId,
                  );

                  if (!isAlbumLinkedToArtist)
                    availableArtist.albums?.push({
                      title: relevantAlbum.title,
                      albumId: relevantAlbum.albumId,
                    });
                });
              }
              relevantArtists.push(availableArtist);
            }
          }

          // let z = updatedArtists.filter((val) => val.name === newArtistName);
          // z = z.map((artist) => {
          //   artist.songs.push({ title, songId });

          //   if (relevantAlbums.length > 0) {
          //     relevantAlbums.forEach(
          //       (relevantAlbum) =>
          //         artist.albums?.push({
          //           title: relevantAlbum.title,
          //           albumId: relevantAlbum.albumId,
          //         }),
          //     );
          //   }
          //   relevantArtists.push(artist);
          //   return artist;
          // });
          // updatedArtists = updatedArtists
          //   .filter((val) => val.name !== newArtistName)
          //   .concat(z);
        } else {
          const artist: SavableArtist = {
            name: newArtistName,
            artistId: generateRandomId(),
            songs: [{ songId, title }],
            artworkName:
              songArtworkPaths && !songArtworkPaths.isDefaultArtwork
                ? path.basename(songArtworkPaths.artworkPath)
                : undefined,
            albums:
              relevantAlbums.length > 0
                ? [
                    {
                      title: relevantAlbums[0].title,
                      albumId: relevantAlbums[0].albumId,
                    },
                  ]
                : [],
            isAFavorite: false,
          };
          relevantArtists.push(artist);
          allArtists.push(artist);
        }
      }
      return { updatedArtists: allArtists, newArtists, relevantArtists };
    }
    return { updatedArtists: allArtists, newArtists, relevantArtists };
  }
  return { updatedArtists: [], newArtists, relevantArtists };
};

export default manageArtistsOfParsedSong;
