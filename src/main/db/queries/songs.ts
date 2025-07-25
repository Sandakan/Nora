import { db } from '@db/db';
import { folderBlacklist, musicFolders, songs } from '@db/schema';
import { and, asc, desc, eq, inArray, notInArray } from 'drizzle-orm';

export const isSongWithPathAvailable = async (path: string, trx: DB | DBTransaction = db) => {
  const count = await trx.$count(songs, eq(songs.path, path));

  return count > 0;
};

export const saveSong = async (data: typeof songs.$inferInsert, trx: DB | DBTransaction = db) => {
  const res = await trx.insert(songs).values(data).returning();
  return res[0];
};

export const getSongsRelativeToFolder = async (
  folderPathOrId: string | number,
  options = {
    skipBlacklistedFolders: false,
    skipBlacklistedSongs: false
  },
  trx: DB | DBTransaction = db
) => {
  const folder = await trx.query.musicFolders.findFirst({
    where:
      typeof folderPathOrId === 'string'
        ? eq(musicFolders.path, folderPathOrId)
        : eq(musicFolders.id, folderPathOrId),
    columns: { id: true }
  });

  if (!folder) return [];

  // Check if folder is blacklisted
  if (options?.skipBlacklistedFolders) {
    const blacklistedFolder = await trx.query.folderBlacklist.findFirst({
      where: eq(folderBlacklist.folderId, folder.id),
      columns: { folderId: true }
    });

    if (blacklistedFolder) return [];
  }

  // If we want to skip blacklisted songs, fetch their IDs
  let blacklistedSongIds: number[] = [];
  if (options?.skipBlacklistedSongs) {
    const blacklist = await trx.query.songBlacklist.findMany({
      columns: { songId: true }
    });
    blacklistedSongIds = blacklist.map((b) => b.songId);
  }

  // Final songs query
  const folderSongs = await trx.query.songs.findMany({
    where: (s) =>
      eq(s.folderId, folder.id) &&
      (options?.skipBlacklistedSongs ? notInArray(s.id, blacklistedSongIds) : undefined)
  });

  return folderSongs;
};

export async function getSongsInFolders(
  folderIds: number[],
  options?: {
    skipBlacklistedSongs?: boolean;
    skipBlacklistedFolders?: boolean;
  },
  trx: DB | DBTransaction = db
) {
  if (folderIds.length === 0) return [];

  let validFolderIds = folderIds;

  // Filter out blacklisted folders if needed
  if (options?.skipBlacklistedFolders) {
    const blacklistedFolders = await trx.query.folderBlacklist.findMany({
      where: inArray(folderBlacklist.folderId, folderIds),
      columns: { folderId: true }
    });

    const blacklistedSet = new Set(blacklistedFolders.map((entry) => entry.folderId));
    validFolderIds = folderIds.filter((id) => !blacklistedSet.has(id));

    if (validFolderIds.length === 0) return [];
  }

  // Prepare to filter out blacklisted songs if needed
  let blacklistedSongIds: number[] = [];
  if (options?.skipBlacklistedSongs) {
    const blacklistedSongs = await trx.query.songBlacklist.findMany({
      columns: { songId: true }
    });
    blacklistedSongIds = blacklistedSongs.map((entry) => entry.songId);
  }

  // Query the songs
  const result = await trx.query.songs.findMany({
    where: (s) =>
      and(
        inArray(s.folderId, validFolderIds),
        options?.skipBlacklistedSongs ? notInArray(s.id, blacklistedSongIds) : undefined
      )
  });

  return result;
}

export type GetAllSongsReturnType = Awaited<ReturnType<typeof getAllSongs>>['data'];
const defaultGetAllSongsOptions = {
  start: 0,
  end: 0,
  filterType: 'notSelected' as SongFilterTypes,
  sortType: 'aToZ' as SongSortTypes
};
export type GetAllSongsOptions = Partial<typeof defaultGetAllSongsOptions>;

export const getAllSongs = async (
  options: GetAllSongsOptions = defaultGetAllSongsOptions,
  trx: DB | DBTransaction = db
) => {
  const { start = 0, end = 0, filterType = 'notSelected', sortType = 'aToZ' } = options;
  const limit = end - start === 0 ? undefined : end - start;

  // Fetch all songs with their relations
  const songsData = await trx.query.songs.findMany({
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true }
          }
        }
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true }
          }
        }
      },
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
      blacklist: {
        columns: { songId: true }
        // where: (songs) => {
        //   // Apply filter for blacklisted songs if needed
        //   const filters: SQL[] = [];

        //   // if (filterType === 'blacklistedSongs') {
        //   //   filters.push(eq(songs.blacklist.length, 1));
        //   // } else if (filterType === 'notBlacklisted') {
        //   //   filters.push(eq(songs.blacklist.length, 0));
        //   // }

        //   return or(...filters);
        // }
      }
    },
    orderBy: (songs) => {
      if (sortType === 'aToZ') return [asc(songs.title)];
      if (sortType === 'zToA') return [desc(songs.title)];
      if (sortType === 'releasedYearAscending') return [asc(songs.year), asc(songs.title)];
      if (sortType === 'releasedYearDescending') return [desc(songs.year), asc(songs.title)];
      if (sortType === 'trackNoAscending') return [asc(songs.trackNumber), asc(songs.title)];
      if (sortType === 'trackNoDescending') return [desc(songs.trackNumber), asc(songs.title)];
      if (sortType === 'dateAddedAscending') return [asc(songs.fileModifiedAt), asc(songs.title)];
      if (sortType === 'dateAddedDescending') return [desc(songs.fileModifiedAt), asc(songs.title)];
      if (sortType === 'addedOrder') return [desc(songs.createdAt), asc(songs.title)];

      return [];
    },
    offset: start,
    limit: limit
  });

  return {
    data: songsData,
    sortType,
    filterType,
    start,
    end
  };
};

export type GetNonNullSongReturnType = NonNullable<Awaited<ReturnType<typeof getSongById>>>;
export const getSongById = async (songId: number, trx: DB | DBTransaction = db) => {
  const song = await trx.query.songs.findFirst({
    where: eq(songs.id, songId),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true }
          }
        }
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true }
          }
        }
      },
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
      blacklist: {
        columns: { songId: true }
      }
    }
  });
  return song;
};

export const getSongByPath = async (path: string, trx: DB | DBTransaction = db) => {
  const song = await trx.query.songs.findFirst({
    where: eq(songs.path, path),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true }
          }
        }
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true }
          }
        }
      },
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
      blacklist: {
        columns: { songId: true }
      }
    }
  });
  return song;
};

export const updateSongByPath = async (
  path: string,
  song: Partial<typeof songs.$inferInsert>,
  trx: DB | DBTransaction = db
) => {
  const updatedSong = await trx.update(songs).set(song).where(eq(songs.path, path)).returning();
  return updatedSong;
};
