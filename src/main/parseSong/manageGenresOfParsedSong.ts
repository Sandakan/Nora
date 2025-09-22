import { linkArtworksToGenre } from '@main/db/queries/artworks';
import { createGenre, getGenreWithTitle, linkSongToGenre } from '@main/db/queries/genres';
import type { genres } from '@main/db/schema';

const manageGenresOfParsedSong = async (
  data: { songId: number; artworkId: number; songGenres: string[] },
  trx: DBTransaction
) => {
  const newGenres: (typeof genres.$inferSelect)[] = [];
  const relevantGenres: (typeof genres.$inferSelect)[] = [];
  const { songId, songGenres, artworkId } = data;

  for (const songGenre of songGenres) {
    const songGenreName = songGenre.trim();
    const availableGenre = await getGenreWithTitle(songGenreName, trx);

    if (availableGenre) {
      await linkSongToGenre(availableGenre.id, songId, trx);
      relevantGenres.push(availableGenre);
    } else {
      const genre = await createGenre({ name: songGenreName }, trx);

      await linkArtworksToGenre([{ artworkId, genreId: genre.id }], trx);
      await linkSongToGenre(genre.id, songId, trx);

      relevantGenres.push(genre);
      newGenres.push(genre);
    }
  }
  return { newGenres, relevantGenres };
};

export default manageGenresOfParsedSong;
