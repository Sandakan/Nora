import { db } from "@db/db";
import { musicFolders, songs } from "@db/schema";
import { timeEnd, timeStart } from "@main/utils/measureTimeUsage";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import {
  cursorColumnsBySortType,
  decodeCursor,
  encodeCursor,
} from "./cursorUtils";

export const isSongWithPathAvailable = async (
  path: string,
  trx: DB | DBTransaction = db,
) => {
  const count = await trx.$count(songs, eq(songs.path, path));

  return count > 0;
};

export const saveSong = async (
  data: typeof songs.$inferInsert,
  trx: DB | DBTransaction = db,
) => {
  const res = await trx.insert(songs).values(data).returning();
  return res[0];
};

export const updateSongBasicFields = async (
  songId: number,
  data: Partial<
    Pick<typeof songs.$inferInsert, "title" | "year" | "trackNumber">
  >,
  trx: DB | DBTransaction = db,
) => {
  const res = await trx
    .update(songs)
    .set({
      title: data.title,
      year: data.year || null,
      trackNumber: data.trackNumber || null,
    })
    .where(eq(songs.id, songId))
    .returning();

  return res[0];
};

export const getSongsRelativeToFolder = async (
  folderPathOrId: string | number,
  options = {
    skipBlacklistedFolders: false,
    skipBlacklistedSongs: false,
  },
  trx: DB | DBTransaction = db,
) => {
  const folder = await trx.query.musicFolders.findFirst({
    where: typeof folderPathOrId === "string"
      ? eq(musicFolders.path, folderPathOrId)
      : eq(musicFolders.id, folderPathOrId),
    columns: { id: true, isBlacklisted: true },
    with: {
      songs: {
        columns: { id: true, path: true, isBlacklisted: true },
      },
    },
  });

  if (!folder) return [];

  // Check if folder is blacklisted
  if (options?.skipBlacklistedFolders && folder.isBlacklisted) return [];

  // Filter out blacklisted songs if needed
  if (options?.skipBlacklistedSongs) {
    return folder.songs.filter((song) => !song.isBlacklisted);
  }

  return folder.songs;
};

export async function getSongsInFolders(
  folderIds: number[],
  options?: {
    skipBlacklistedSongs?: boolean;
    skipBlacklistedFolders?: boolean;
  },
  trx: DB | DBTransaction = db,
) {
  if (folderIds.length === 0) return [];

  let validFolderIds = folderIds;

  // Filter out blacklisted folders if needed
  if (options?.skipBlacklistedFolders) {
    const blacklistedFolders = await trx.query.musicFolders.findMany({
      where: and(
        inArray(musicFolders.id, folderIds),
        eq(musicFolders.isBlacklisted, true),
      ),
      columns: { id: true },
    });

    validFolderIds = folderIds.filter((id) =>
      !blacklistedFolders.some((bf) => bf.id === id)
    );

    if (validFolderIds.length === 0) return [];
  }

  // Query the songs
  const result = await trx.query.songs.findMany({
    where: (s) =>
      and(
        inArray(s.folderId, validFolderIds),
        eq(s.isBlacklisted, options?.skipBlacklistedSongs ?? false),
      ),
  });

  return result;
}

export type GetAllSongsReturnType = Awaited<
  ReturnType<typeof getAllSongs>
>["data"];
const defaultGetAllSongsOptions = {
  songIds: [] as number[],
  start: 0,
  end: 0,
  filterType: "notSelected" as SongFilterTypes,
  sortType: "aToZ" as SongSortTypes,
  preserveIdOrder: false,
};
export type GetAllSongsOptions = Partial<typeof defaultGetAllSongsOptions>;

export const getAllSongs = async (
  options: GetAllSongsOptions = defaultGetAllSongsOptions,
  trx: DB | DBTransaction = db,
) => {
  const {
    start = 0,
    end = 0,
    filterType = "notSelected",
    sortType = "aToZ",
    songIds = [],
    preserveIdOrder = false,
  } = options;

  const limit = end - start === 0 ? undefined : end - start;

  const timer = timeStart();
  // Fetch all songs with their relations
  const songsData = await trx.query.songs.findMany({
    where: (s) => {
      const filters: SQL[] = [];

      if (songIds && songIds.length > 0) {
        filters.push(inArray(s.id, songIds));
      }

      if (filterType === "favorites" || filterType === "nonFavorites") {
        filters.push(eq(s.isFavorite, filterType === "favorites"));
      }

      if (
        filterType === "blacklistedSongs" || filterType === "whitelistedSongs"
      ) {
        filters.push(eq(s.isBlacklisted, filterType === "blacklistedSongs"));
      }

      return filters.length > 0 ? and(...filters) : undefined;
    },
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true },
          },
        },
      },
    },
    orderBy: (songs) => {
      if (sortType === "aToZ") return [asc(songs.title)];
      if (sortType === "zToA") return [desc(songs.title)];
      if (sortType === "releasedYearAscending") {
        return [asc(songs.year), asc(songs.title)];
      }
      if (sortType === "releasedYearDescending") {
        return [desc(songs.year), asc(songs.title)];
      }
      if (sortType === "trackNoAscending") {
        return [asc(songs.trackNumber), asc(songs.title)];
      }
      if (sortType === "trackNoDescending") {
        return [desc(songs.trackNumber), asc(songs.title)];
      }
      if (sortType === "dateAddedAscending") {
        return [asc(songs.fileModifiedAt), asc(songs.title)];
      }
      if (sortType === "dateAddedDescending") {
        return [desc(songs.fileModifiedAt), asc(songs.title)];
      }
      if (sortType === "addedOrder") {
        return [desc(songs.createdAt), asc(songs.title)];
      }

      return [];
    },
    offset: start,
    limit: limit,
  });
  timeEnd(timer);

  // If preserveIdOrder is true, sort the results to match the input songIds order
  let sortedData = songsData;
  if (preserveIdOrder && songIds.length > 0) {
    const idToIndex = new Map(songIds.map((id, index) => [id, index]));
    sortedData = songsData.sort((a, b) => {
      const indexA = idToIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const indexB = idToIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });
  }

  return {
    data: sortedData,
    sortType,
    filterType,
    start,
    end,
  };
};

/**
 * Cursor-based pagination for songs with deterministic results.
 * Provides efficient pagination regardless of data size.
 * Cursors are URI-encoded strings: "column1:value1|column2:value2"
 */
export const getAllSongsCursor = async (
  options: {
    cursor?: string;
    limit?: number;
    filterType?: SongFilterTypes;
    sortType?: SongSortTypes;
    songIds?: number[];
  } = {},
  trx: DB | DBTransaction = db,
) => {
  const {
    cursor,
    limit = 50,
    filterType = "notSelected",
    sortType = "aToZ",
    songIds = [],
  } = options;

  // Fetch one extra record to determine if there are more results
  const queryLimit = limit + 1;

  // Decode cursor if provided
  let decodedCursor: Record<string, string> | undefined;
  if (cursor) {
    decodedCursor = decodeCursor(cursor);
  }

  // Build cursor WHERE clause
  const cursorWhereClause = buildCursorWhereClauseForSongs(
    decodedCursor,
    sortType,
  );

  const timer = timeStart();

  // Fetch songs with cursor-based pagination
  const songsData = await trx.query.songs.findMany({
    where: (s) => {
      const filters: SQL[] = [];

      if (songIds && songIds.length > 0) {
        filters.push(inArray(s.id, songIds));
      }

      if (filterType === "favorites" || filterType === "nonFavorites") {
        filters.push(eq(s.isFavorite, filterType === "favorites"));
      }

      if (
        filterType === "blacklistedSongs" || filterType === "whitelistedSongs"
      ) {
        filters.push(eq(s.isBlacklisted, filterType === "blacklistedSongs"));
      }

      if (cursorWhereClause) {
        filters.push(cursorWhereClause);
      }

      return filters.length > 0 ? and(...filters) : undefined;
    },
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true },
          },
        },
      },
    },
    orderBy: (s) => {
      const orders: ReturnType<typeof asc>[] = [];

      if (sortType === "aToZ") orders.push(asc(s.title), asc(s.id));
      else if (sortType === "zToA") orders.push(desc(s.title), asc(s.id));
      else if (sortType === "releasedYearAscending") {
        orders.push(asc(s.year), asc(s.title), asc(s.id));
      } else if (sortType === "releasedYearDescending") {
        orders.push(desc(s.year), asc(s.title), asc(s.id));
      } else if (sortType === "trackNoAscending") {
        orders.push(asc(s.trackNumber), asc(s.title), asc(s.id));
      } else if (sortType === "trackNoDescending") {
        orders.push(desc(s.trackNumber), asc(s.title), asc(s.id));
      } else if (sortType === "dateAddedAscending") {
        orders.push(asc(s.fileModifiedAt), asc(s.title), asc(s.id));
      } else if (sortType === "dateAddedDescending") {
        orders.push(desc(s.fileModifiedAt), asc(s.title), asc(s.id));
      } else if (sortType === "addedOrder") {
        orders.push(desc(s.createdAt), asc(s.id));
      }

      return orders;
    },
    limit: queryLimit,
  });

  timeEnd(timer);

  // Check if there are more results
  const hasMore = songsData.length > limit;
  const resultData = songsData.slice(0, limit);

  // Generate next cursor from the last item if there are more results
  let nextCursor: string | undefined;
  if (hasMore && resultData.length > 0) {
    const lastSong = resultData[resultData.length - 1];
    nextCursor = generateCursorForSong(lastSong, sortType);
  }

  return {
    data: resultData,
    sortType,
    filterType,
    nextCursor,
    hasMore,
  };
};

/**
 * Generates a cursor string from a song object based on sort type.
 */
function generateCursorForSong(song: any, sortType: SongSortTypes): string {
  const config = cursorColumnsBySortType[sortType];

  if (!config) {
    return encodeCursor({ id: song.id });
  }

  const cursorValues: Record<string, unknown> = {};

  for (const column of config.columns) {
    if (column === "id") {
      cursorValues.id = song.id;
    } else if (column === "title") {
      cursorValues.title = song.title;
    } else if (column === "createdAt") {
      cursorValues.createdAt = song.createdAt;
    } else if (column === "fileModifiedAt") {
      cursorValues.fileModifiedAt = song.fileModifiedAt;
    } else if (column === "year") {
      cursorValues.year = song.year;
    } else if (column === "trackNumber") {
      cursorValues.trackNumber = song.trackNumber;
    }
  }

  return encodeCursor(cursorValues);
}

/**
 * Builds WHERE clause for cursor-based pagination.
 */
function buildCursorWhereClauseForSongs(
  cursor: Record<string, string> | undefined,
  sortType: string,
): SQL | undefined {
  if (!cursor || Object.keys(cursor).length === 0) {
    return undefined;
  }

  const config = cursorColumnsBySortType[sortType];
  if (!config) {
    return undefined;
  }

  const { columns, ascending } = config;
  const conditions: SQL[] = [];

  // Build keyset pagination WHERE clause
  // For next page: use > operator for ascending sorts, < for descending
  // This ensures we get records after the cursor position
  for (let i = 0; i < columns.length; i++) {
    const columnName = columns[i];
    const cursorValue = cursor[columnName];

    if (cursorValue === undefined || cursorValue === "") {
      continue;
    }

    const equalConditions: SQL[] = [];

    // Add equality conditions for all previous columns
    for (let j = 0; j < i; j++) {
      const prevColumnName = columns[j];
      const prevCursorValue = cursor[prevColumnName];

      if (prevCursorValue !== undefined && prevCursorValue !== "") {
        const prevValue = convertCursorValue(prevColumnName, prevCursorValue);
        const columnRef = getSongColumn(prevColumnName);

        if (columnRef) {
          equalConditions.push(eq(columnRef as any, prevValue));
        }
      }
    }

    // Add comparison condition for current column
    const value = convertCursorValue(columnName, cursorValue);
    const columnRef = getSongColumn(columnName);

    if (columnRef) {
      const comparisonOp = ascending ? gt : lt;
      const comparison = comparisonOp(columnRef as any, value);

      if (equalConditions.length > 0) {
        const andCondition = and(
          ...(equalConditions as any),
          comparison as any,
        );
        if (andCondition) {
          conditions.push(andCondition);
        }
      } else {
        conditions.push(comparison);
      }
    }
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return or(...(conditions as any));
}

/**
 * Gets the Drizzle column reference for a song field.
 */
function getSongColumn(columnName: string): any {
  switch (columnName) {
    case "id":
      return songs.id;
    case "title":
      return songs.title;
    case "createdAt":
      return songs.createdAt;
    case "fileModifiedAt":
      return songs.fileModifiedAt;
    case "year":
      return songs.year;
    case "trackNumber":
      return songs.trackNumber;
    default:
      return null;
  }
}

/**
 * Converts cursor value string to appropriate type.
 */
function convertCursorValue(columnName: string, value: string): any {
  if (
    columnName === "id" || columnName === "year" || columnName === "trackNumber"
  ) {
    return parseInt(value, 10);
  }

  if (columnName === "createdAt" || columnName === "fileModifiedAt") {
    return new Date(value);
  }

  return value;
}

export type GetNonNullSongReturnType = NonNullable<
  Awaited<ReturnType<typeof getSongById>>
>;
export const getSongById = async (
  songId: number,
  trx: DB | DBTransaction = db,
) => {
  const song = await trx.query.songs.findFirst({
    where: eq(songs.id, songId),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });
  return song;
};

export const getSongByPath = async (
  path: string,
  trx: DB | DBTransaction = db,
) => {
  const song = await trx.query.songs.findFirst({
    where: eq(songs.path, path),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });
  return song;
};

export const updateSongByPath = async (
  path: string,
  song: Partial<typeof songs.$inferInsert>,
  trx: DB | DBTransaction = db,
) => {
  const updatedSong = await trx.update(songs).set(song).where(
    eq(songs.path, path),
  ).returning();
  return updatedSong;
};

export const searchSongs = async (
  keyword: string,
  trx: DB | DBTransaction = db,
) => {
  const data = await trx.query.songs.findMany({
    where: or(ilike(songs.title, `%${keyword}%`)),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });
  return data;
};

export const getSongsByNames = async (
  songNames: string[],
  trx: DB | DBTransaction = db,
) => {
  if (songNames.length === 0) return [];

  const data = await trx.query.songs.findMany({
    where: inArray(songs.title, songNames),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });
  return data;
};

export const getSongFavoriteStatuses = async (
  songIds: number[],
  trx: DB | DBTransaction = db,
) => {
  const data = await trx
    .select({ id: songs.id, isFavorite: songs.isFavorite })
    .from(songs)
    .where(inArray(songs.id, songIds));
  return data;
};

export const updateSongFavoriteStatuses = async (
  songIds: number[],
  isFavorite: boolean,
  trx: DB | DBTransaction = db,
) => {
  const data = await trx
    .update(songs)
    .set({ isFavorite, isFavoriteUpdatedAt: new Date() })
    .where(inArray(songs.id, songIds));
  return data;
};

export const getPlayableSongById = async (
  songId: number,
  trx: DB | DBTransaction = db,
) => {
  const song = await trx.query.songs.findFirst({
    where: eq(songs.id, songId),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
            with: {
              artworks: {
                with: {
                  artwork: true,
                },
              },
            },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
    },
  });
  return song;
};

export const getSongsInPathList = async (
  songPaths: string[],
  trx: DB | DBTransaction = db,
) => {
  if (songPaths.length === 0) return [];

  const data = await trx.query.songs.findMany({
    where: inArray(songs.path, songPaths),
    columns: { id: true, path: true },
  });
  return data;
};

export const getAllSongsInFavorite = async (
  sortType?: SongSortTypes,
  paginatingData?: PaginatingData,
  trx: DB | DBTransaction = db,
) => {
  const { start = 0, end = 0 } = paginatingData || {};

  const limit = end - start === 0 ? undefined : end - start;

  const data = await trx.query.songs.findMany({
    where: (songs) => eq(songs.isFavorite, true),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true },
          },
        },
      },
    },
    orderBy: (songs) => {
      const orders: SQL[] = [desc(songs.isFavoriteUpdatedAt)];
      // Apply sorting based on sortType parameter
      if (sortType === "aToZ") return [asc(songs.title), ...orders];
      if (sortType === "zToA") return [desc(songs.title), ...orders];
      if (sortType === "releasedYearAscending") {
        return [asc(songs.year), asc(songs.title), ...orders];
      }
      if (sortType === "releasedYearDescending") {
        return [desc(songs.year), asc(songs.title), ...orders];
      }
      if (sortType === "trackNoAscending") {
        return [asc(songs.trackNumber), asc(songs.title), ...orders];
      }
      if (sortType === "trackNoDescending") {
        return [desc(songs.trackNumber), asc(songs.title), ...orders];
      }
      if (sortType === "dateAddedAscending") {
        return [asc(songs.fileModifiedAt), asc(songs.title), ...orders];
      }
      if (sortType === "dateAddedDescending") {
        return [desc(songs.fileModifiedAt), asc(songs.title), ...orders];
      }
      if (sortType === "addedOrder") return orders;
      // Add other sort types as needed
      return orders; // Default sorting
    },
    limit: limit,
    offset: start,
  });

  return {
    data,
    sortType,
    filterType: "notSelected",
    start,
    end,
  };
};

export const getSongArtworksBySongIds = async (
  songIds: number[],
  trx: DB | DBTransaction = db,
) => {
  if (songIds.length === 0) return [];

  const data = await trx.query.songs.findMany({
    where: inArray(songs.id, songIds),
    columns: {
      id: true,
    },
    with: {
      artworks: {
        with: {
          artwork: true,
        },
      },
    },
  });
  return data;
};

export const getSongIdFromSongPath = async (
  path: string,
  trx: DB | DBTransaction = db,
) => {
  const song = await trx.query.songs.findFirst({
    where: eq(songs.path, path),
    columns: { id: true },
  });
  return song?.id ?? null;
};

export const getSongByIdForSongMetadata = async (
  songId: number,
  trx: DB | DBTransaction = db,
) => {
  const song = await trx.query.songs.findFirst({
    where: eq(songs.id, songId),
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true },
            with: {
              artworks: {
                with: {
                  artwork: true,
                },
              },
            },
          },
        },
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true },
                    with: {
                      artworks: {
                        with: {
                          artwork: true,
                        },
                      },
                    },
                  },
                },
              },
              artworks: {
                with: {
                  artwork: true,
                },
              },
            },
          },
        },
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true },
            with: {
              artworks: {
                with: {
                  artwork: true,
                },
              },
            },
          },
        },
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {},
                },
              },
            },
          },
        },
      },
    },
  });
  return song;
};

export const removeSongById = async (
  songId: number,
  trx: DB | DBTransaction = db,
) => {
  await trx.delete(songs).where(eq(songs.id, songId));
};

export const updateSongModifiedAtByPath = async (
  songPath: string,
  modifiedAt: Date,
  trx: DB | DBTransaction = db,
) => {
  await trx.update(songs).set({ fileModifiedAt: modifiedAt }).where(
    eq(songs.path, songPath),
  );
};
