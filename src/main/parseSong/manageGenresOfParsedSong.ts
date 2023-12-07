import path from 'path';

import { generateRandomId } from '../utils/randomId';

export const manageGenresOfParsedSong = (
  allGenres: SavableGenre[],
  songInfo: SavableSongData,
  songArtworkPaths?: ArtworkPaths,
  darkVibrantBgColor?: { rgb: [number, number, number] },
) => {
  const newGenres: SavableGenre[] = [];
  const relevantGenres: SavableGenre[] = [];
  const { title, songId, genres: songGenres } = songInfo;

  // let genres = allGenres;
  if (
    Array.isArray(songGenres) &&
    songGenres.length > 0 &&
    Array.isArray(allGenres)
  ) {
    for (const songGenre of songGenres) {
      const songGenreName = songGenre.name.trim();
      const availableGenre = allGenres.find(
        (genre) => genre.name === songGenreName,
      );

      if (availableGenre) {
        availableGenre.artworkName =
          songArtworkPaths && !songArtworkPaths.isDefaultArtwork
            ? path.basename(songArtworkPaths.artworkPath)
            : availableGenre.artworkName || undefined;
        availableGenre.backgroundColor =
          darkVibrantBgColor || availableGenre.backgroundColor;
        availableGenre.songs.push({ songId, title });
        relevantGenres.push(availableGenre);

        // let y = genres.filter((genre) => genre.name === songGenreName);
        // y = y.map((z) => {
        //   z.artworkName =
        //     songArtworkPaths && !songArtworkPaths.isDefaultArtwork
        //       ? path.basename(songArtworkPaths.artworkPath)
        //       : z.artworkName || undefined;
        //   z.backgroundColor = darkVibrantBgColor || z.backgroundColor;
        //   z.songs.push({ songId, title });
        //   relevantGenres.push(z);
        //   return z;
        // });
        // genres = genres
        //   .filter((genre) => genre.name !== songGenreName)
        //   .concat(y);
      } else {
        const newGenre: SavableGenre = {
          name: songGenreName,
          genreId: generateRandomId(),
          songs: [{ songId, title }],
          artworkName:
            songArtworkPaths && !songArtworkPaths.isDefaultArtwork
              ? path.basename(songArtworkPaths.artworkPath)
              : undefined,
          backgroundColor: darkVibrantBgColor,
        };
        relevantGenres.push(newGenre);
        newGenres.push(newGenre);
        allGenres.push(newGenre);
      }
    }
    return { updatedGenres: allGenres, newGenres, relevantGenres };
  }
  return { updatedGenres: allGenres || [], newGenres, relevantGenres };
};

export default manageGenresOfParsedSong;
