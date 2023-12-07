import path from 'path';

import { generateRandomId } from '../utils/randomId';

const manageArtistsOfParsedSong = (
  allArtists: SavableArtist[],
  songInfo: SavableSongData,
  songArtworkPaths?: ArtworkPaths,
) => {
  const newArtists: SavableArtist[] = [];
  const relevantArtists: SavableArtist[] = [];
  const { title, songId, artists: songArtists } = songInfo;

  if (Array.isArray(allArtists)) {
    if (songArtists && songArtists.length > 0) {
      for (const newArtist of songArtists) {
        const newArtistName = newArtist.name.trim();

        const availableArtist = allArtists.find(
          (artist) => artist.name === newArtistName,
        );

        if (availableArtist) {
          availableArtist.songs.push({ title, songId });
          relevantArtists.push(availableArtist);
        } else {
          const artist: SavableArtist = {
            name: newArtistName,
            artistId: generateRandomId(),
            songs: [{ songId, title }],
            artworkName:
              songArtworkPaths && !songArtworkPaths.isDefaultArtwork
                ? path.basename(songArtworkPaths.artworkPath)
                : undefined,
            isAFavorite: false,
          };
          relevantArtists.push(artist);
          newArtists.push(artist);
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
