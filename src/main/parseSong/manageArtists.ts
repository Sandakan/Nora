import path from 'path';

import { generateRandomId } from '../utils/randomId';

const manageArtists = (
  allArtists: SavableArtist[],
  songTitle: string,
  songId: string,
  songArtists?: { name: string; artistId?: string }[],
  songArtworkPaths?: ArtworkPaths,
  relevantAlbums = [] as SavableAlbum[]
) => {
  let updatedArtists = allArtists;
  const newArtists: SavableArtist[] = [];
  const relevantArtists: SavableArtist[] = [];

  if (Array.isArray(updatedArtists)) {
    if (songArtists && songArtists.length > 0) {
      for (let x = 0; x < songArtists.length; x += 1) {
        const newArtist = songArtists[x];

        const isArtistAvailable = allArtists.some(
          (artist) => artist.name === newArtist.name
        );
        if (isArtistAvailable) {
          let z = updatedArtists.filter((val) => val.name === newArtist.name);
          z = z.map((artist) => {
            artist.songs.push({
              title: songTitle,
              songId,
            });
            if (relevantAlbums.length > 0) {
              relevantAlbums.forEach((relevantAlbum) =>
                artist.albums?.push({
                  title: relevantAlbum.title,
                  albumId: relevantAlbum.albumId,
                })
              );
            }
            relevantArtists.push(artist);
            return artist;
          });
          updatedArtists = updatedArtists
            .filter((val) => val.name !== newArtist.name)
            .concat(z);
        } else {
          const artist: SavableArtist = {
            name: newArtist.name,
            artistId: generateRandomId(),
            songs: [
              {
                songId,
                title: songTitle,
              },
            ],
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
          updatedArtists.push(artist);
        }
      }
      return { allArtists: updatedArtists, newArtists, relevantArtists };
    }
    return { allArtists: updatedArtists, newArtists, relevantArtists };
  }
  return { allArtists: [], newArtists, relevantArtists };
};

export default manageArtists;
