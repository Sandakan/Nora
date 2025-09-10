import { db } from '@db/db';
import { and, asc, desc, eq, inArray, SQL, sql } from 'drizzle-orm';
import { albumsArtists, artists, artistsSongs } from '@db/schema';

export const isArtistWithNameAvailable = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(artists).where(eq(artists.name, name)).limit(1);

  return data.length > 0;
};

export const getArtistWithName = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.query.artists.findFirst({
    where: (a) => eq(a.name, name)
  });

  return data;
};

export const getArtistById = async (id: number, trx: DB | DBTransaction = db) => {
  const data = await trx.query.artists.findFirst({
    where: (a) => eq(a.id, id),
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
      },
      albums: {
        with: {
          album: {
            columns: {
              title: true,
              id: true
            }
          }
        }
      }
    }
  });

  return data;
};

export const linkSongToArtist = async (
  artistId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(artistsSongs).values({ artistId, songId }).returning();
};

export const createArtist = async (
  artist: typeof artists.$inferInsert,
  trx: DB | DBTransaction = db
) => {
  const data = await trx.insert(artists).values(artist).returning();

  return data[0];
};

export const getLinkedAlbumArtist = async (
  albumId: number,
  artistId: number,
  trx: DB | DBTransaction = db
) => {
  const data = await trx
    .select()
    .from(albumsArtists)
    .where(and(eq(albumsArtists.albumId, albumId), eq(albumsArtists.artistId, artistId)))
    .limit(1);

  return data.at(0);
};

export const getLinkedSongArtist = async (
  songId: number,
  artistId: number,
  trx: DB | DBTransaction = db
) => {
  const data = await trx
    .select()
    .from(artistsSongs)
    .where(and(eq(artistsSongs.songId, songId), eq(artistsSongs.artistId, artistId)))
    .limit(1);

  return data.at(0);
};

export type GetAllArtistsReturnType = Awaited<ReturnType<typeof getAllArtists>>['data'];
const defaultGetAllArtistsOptions = {
  artistIds: [] as number[],
  start: 0,
  end: 0,
  filterType: 'notSelected' as ArtistFilterTypes,
  sortType: 'aToZ' as ArtistSortTypes
};
export type GetAllArtistsOptions = Partial<typeof defaultGetAllArtistsOptions>;

export const getAllArtists = async (
  options: GetAllArtistsOptions,
  trx: DB | DBTransaction = db
) => {
  const {
    artistIds = [],
    start = 0,
    end = 0,
    filterType = 'notSelected',
    sortType = 'aToZ'
  } = options;
  const limit = end - start === 0 ? undefined : end - start;

  const data = await trx.query.artists.findMany({
    where: (s) => {
      const filters: SQL[] = [];

      // Filter by artist IDs
      if (artistIds && artistIds.length > 0) {
        filters.push(inArray(s.id, artistIds));
      }

      // Apply additional filters based on filterType
      if (filterType === 'favorites') filters.push(eq(s.isFavorite, true));

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
      },
      albums: {
        with: {
          album: {
            columns: {
              title: true,
              id: true
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
    filterType,
    start,
    end
  };
};

export const getArtistFavoriteStatus = (artistIds: number[], trx: DB | DBTransaction = db) => {
  return trx
    .select({ id: artists.id, isFavorite: artists.isFavorite })
    .from(artists)
    .where(inArray(artists.id, artistIds));
};

export const updateArtistFavoriteStatus = async (
  artistIds: number[],
  isFavorite: boolean,
  trx: DB | DBTransaction = db
) => {
  return trx.update(artists).set({ isFavorite }).where(inArray(artists.id, artistIds));
};

export const getArtistsOfASong = async (songId: number, trx: DB | DBTransaction = db) => {
  const data = await trx
    .select()
    .from(artists)
    .where(
      inArray(artists.id, sql`(SELECT "artistId" FROM "artistsSongs" WHERE "songId" = ${songId})`)
    );

  return data;
};

export const getArtistsByName = async (names: string[], trx: DB | DBTransaction = db) => {
  const data = await trx.query.artists.findMany({
    where: (a) => inArray(a.name, names),
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
      },
      albums: {
        with: {
          album: {
            columns: {
              title: true,
              id: true
            }
          }
        }
      }
    }
  });

  return data;
};
