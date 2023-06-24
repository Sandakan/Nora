import path from 'path';

import { generateRandomId } from '../utils/randomId';

export const manageGenres = (
  allGenres: SavableGenre[],
  songTitle: string,
  songId: string,
  songGenres?: string[],
  songArtworkPaths?: ArtworkPaths,
  darkVibrantBgColor?: { rgb: unknown }
) => {
  const newGenres: SavableGenre[] = [];
  const relevantGenres: SavableGenre[] = [];
  let genres = allGenres;
  if (
    Array.isArray(songGenres) &&
    songGenres.length > 0 &&
    Array.isArray(genres)
  ) {
    for (let x = 0; x < songGenres.length; x += 1) {
      const songGenre = songGenres[x];
      if (genres.some((genre) => genre.name === songGenre)) {
        let y = genres.filter((genre) => genre.name === songGenre);
        y = y.map((z) => {
          z.artworkName =
            songArtworkPaths && !songArtworkPaths.isDefaultArtwork
              ? path.basename(songArtworkPaths.artworkPath)
              : z.artworkName || undefined;
          z.backgroundColor = darkVibrantBgColor || z.backgroundColor;
          z.songs.push({
            songId,
            title: songTitle,
          });
          relevantGenres.push(z);
          return z;
        });
        genres = genres.filter((genre) => genre.name !== songGenre).concat(y);
      } else {
        const newGenre: SavableGenre = {
          name: songGenre,
          genreId: generateRandomId(),
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
          backgroundColor: darkVibrantBgColor,
        };
        relevantGenres.push(newGenre);
        newGenres.push(newGenre);
        genres.push(newGenre);
      }
    }
    return { allGenres: genres, newGenres, relevantGenres };
  }
  return { allGenres: genres || [], newGenres, relevantGenres };
};

export default manageGenres;
