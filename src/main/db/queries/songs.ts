import { db } from '@db/db';
import { folderBlacklist, musicFolders, songs } from '@db/schema';
import { timeEnd, timeStart } from '@main/utils/measureTimeUsage';
import { and, asc, desc, eq, ilike, inArray, notInArray, or, SQL } from 'drizzle-orm';

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
    columns: { id: true },
    with: {
      songs: {
        columns: { id: true, path: true },
        with: {
          blacklist: { columns: { songId: true } }
        }
      },
      blacklist: { columns: { folderId: true } }
    }
  });

  if (!folder) return [];

  // Check if folder is blacklisted
  if (options?.skipBlacklistedFolders && folder.blacklist != null) return [];

  // Filter out blacklisted songs if needed
  if (options?.skipBlacklistedSongs) {
    return folder.songs.filter((song) => song.blacklist == null);
  }

  return folder.songs;
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
  songIds: [] as number[],
  start: 0,
  end: 0,
  filterType: 'notSelected' as SongFilterTypes,
  sortType: 'aToZ' as SongSortTypes,
  preserveIdOrder: false
};
export type GetAllSongsOptions = Partial<typeof defaultGetAllSongsOptions>;

export const getAllSongs = async (
  options: GetAllSongsOptions = defaultGetAllSongsOptions,
  trx: DB | DBTransaction = db
) => {
  const {
    start = 0,
    end = 0,
    filterType = 'notSelected',
    sortType = 'aToZ',
    songIds = [],
    preserveIdOrder = false
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

      return filters.length > 0 ? and(...filters) : undefined;
    },
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
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true }
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
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true }
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
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true }
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
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true }
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
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true }
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
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true }
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

export const searchSongs = async (keyword: string, trx: DB | DBTransaction = db) => {
  const data = await trx.query.songs.findMany({
    where: or(ilike(songs.title, `%${keyword}%`)),
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
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true }
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
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true }
          }
        }
      },
      blacklist: {
        columns: { songId: true }
      }
    }
  });
  return data;
};

export const getSongsByNames = async (songNames: string[], trx: DB | DBTransaction = db) => {
  if (songNames.length === 0) return [];

  const data = await trx.query.songs.findMany({
    where: inArray(songs.title, songNames),
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
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true }
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
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true }
          }
        }
      },
      blacklist: {
        columns: { songId: true }
      }
    }
  });
  return data;
};

export const getSongFavoriteStatuses = async (songIds: number[], trx: DB | DBTransaction = db) => {
  const data = await trx
    .select({ id: songs.id, isFavorite: songs.isFavorite })
    .from(songs)
    .where(inArray(songs.id, songIds));
  return data;
};

export const updateSongFavoriteStatuses = async (
  songIds: number[],
  isFavorite: boolean,
  trx: DB | DBTransaction = db
) => {
  const data = await trx.update(songs).set({ isFavorite }).where(inArray(songs.id, songIds));
  return data;
};

export const getPlayableSongById = async (songId: number, trx: DB | DBTransaction = db) => {
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
                  artwork: true
                }
              }
            }
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

export const getSongsInPathList = async (songPaths: string[], trx: DB | DBTransaction = db) => {
  if (songPaths.length === 0) return [];

  const data = await trx.query.songs.findMany({
    where: inArray(songs.path, songPaths),
    columns: { id: true, path: true }
  });
  return data;
};
