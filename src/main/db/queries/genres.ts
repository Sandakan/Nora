import { db } from '@db/db';
import { and, asc, desc, eq, inArray, SQL } from 'drizzle-orm';
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
  const data = await trx.select().from(genres).where(eq(genres.name, name));

  return data[0];
};

export const linkSongToGenre = async (
  genreId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(genresSongs).values({ genreId, songId });
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
