import { db } from '@db/db';
import { and, asc, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { genres, genresSongs } from '@db/schema';

export const isGenreWithIdAvailable = async (genreId: number, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(genres).where(eq(genres.id, genreId));

  return data.length > 0;
};

export const isGenreWithTitleAvailable = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(genres).where(eq(genres.name, name));

  return data.length > 0;
};

export type GetAllGenresReturnType = Awaited<ReturnType<typeof getAllGenres>>;

const defaultGetAllGenresOptions = {
  genreIds: [] as number[],
  start: 0,
  end: 0,
  sortType: 'aToZ' as GenreSortTypes
};
export type GetAllGenresOptions = Partial<typeof defaultGetAllGenresOptions>;
export const getAllGenres = async (options: GetAllGenresOptions, trx: DB | DBTransaction = db) => {
  const { genreIds = [], start = 0, end = 0, sortType = 'aToZ' } = options;

  const limit = end - start === 0 ? undefined : end - start;

  const data = await trx.query.genres.findMany({
    where: (s) => {
      const filters: SQL[] = [];

      // Filter by genre IDs
      if (genreIds && genreIds.length > 0) {
        filters.push(inArray(s.id, genreIds));
      }

      return and(...filters);
    },
    with: {
      songs: { with: { song: { columns: { id: true, title: true } } } },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {}
                }
              }
            }
          }
        }
      }
    },
    limit,
    offset: start,
    orderBy: (artists) => {
      if (sortType === 'aToZ') return [asc(artists.name)];
      if (sortType === 'zToA') return [desc(artists.name)];

      return [];
    }
  });

  return {
    data,
    sortType,
    start,
    end
  };
};

export const getGenreWithTitle = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.query.genres.findFirst({
    where: (a) => eq(a.nameCI, name)
  });

  return data;
};

export const linkSongToGenre = async (
  genreId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(genresSongs).values({ genreId, songId });
};

/**
 * Unlinks a song from a genre by deleting the relationship in the genresSongs table.
 * This does NOT delete the genre or song themselves - only the relationship between them.
 * 
 * @param genreId - The ID of the genre
 * @param songId - The ID of the song
 * @param trx - Database transaction instance (defaults to main db connection)
 * @returns Promise that resolves when the relationship is deleted
 */
export const unlinkSongFromGenre = async (
  genreId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx
    .delete(genresSongs)
    .where(and(eq(genresSongs.genreId, genreId), eq(genresSongs.songId, songId)));
};

export const createGenre = async (
  genre: typeof genres.$inferInsert,
  trx: DB | DBTransaction = db
) => {
  const data = await trx.insert(genres).values(genre).returning();

  return data[0];
};

export const getLinkedSongGenre = async (
  genreId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  const data = await trx
    .select()
    .from(genresSongs)
    .where(and(eq(genresSongs.genreId, genreId), eq(genresSongs.songId, songId)))
    .limit(1);

  return data.at(0);
};

export const getGenreByName = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.query.genres.findFirst({
    where: (g) => eq(g.nameCI, name)
  });

  return data;
};

export const getGenreSongIds = async (genreId: number, trx: DB | DBTransaction = db) => {
  const data = await trx
    .select({ songId: genresSongs.songId })
    .from(genresSongs)
    .where(eq(genresSongs.genreId, genreId));

  return data.map((row) => row.songId);
};

/**
 * Deletes a genre from the database.
 * 
 * **Cascade Behavior:**
 * - All entries in `genresSongs` linking this genre to songs are automatically deleted (ON DELETE CASCADE)
 * - All entries in `artworksGenres` linking this genre to artworks are automatically deleted (ON DELETE CASCADE)
 * 
 * **Important:** This function should only be called after verifying the genre has no remaining songs.
 * Use `getGenreSongIds()` to check before deletion to prevent data inconsistency.
 * 
 * @param genreId - The ID of the genre to delete
 * @param trx - Database transaction instance (defaults to main db connection)
 * @returns Promise that resolves when the genre is deleted
 */
export const deleteGenre = async (genreId: number, trx: DB | DBTransaction = db) => {
  return trx.delete(genres).where(eq(genres.id, genreId));
};
