import path from 'path';

import { generateRandomId } from '../utils/randomId';

export const manageGenresOfParsedSong = (
  allGenres: SavableGenre[],
  songInfo: SavableSongData,
  songArtworkPaths?: ArtworkPaths,
  darkVibrantBgColor?: { rgb: unknown }
) => {
  const newGenres: SavableGenre[] = [];
  const relevantGenres: SavableGenre[] = [];
  const { title, songId, genres: songGenres } = songInfo;

  let genres = allGenres;
  if (
    Array.isArray(songGenres) &&
    songGenres.length > 0 &&
    Array.isArray(genres)
  ) {
    for (let x = 0; x < songGenres.length; x += 1) {
      const songGenre = songGenres[x];
      if (genres.some((genre) => genre.name === songGenre.name)) {
        let y = genres.filter((genre) => genre.name === songGenre.name);
        y = y.map((z) => {
          z.artworkName =
            songArtworkPaths && !songArtworkPaths.isDefaultArtwork
              ? path.basename(songArtworkPaths.artworkPath)
              : z.artworkName || undefined;
          z.backgroundColor = darkVibrantBgColor || z.backgroundColor;
          z.songs.push({ songId, title });
          relevantGenres.push(z);
          return z;
        });
        genres = genres
          .filter((genre) => genre.name !== songGenre.name)
          .concat(y);
      } else {
        const newGenre: SavableGenre = {
          name: songGenre.name,
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
        genres.push(newGenre);
      }
    }
    return { updatedGenres: genres, newGenres, relevantGenres };
  }
  return { updatedGenres: genres || [], newGenres, relevantGenres };
};

export default manageGenresOfParsedSong;
