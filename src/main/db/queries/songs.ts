import { db } from '@db/db';
import { folderBlacklist, musicFolders, songs } from '@db/schema';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

export const isSongWithPathAvailable = async (path: string, trx: DB | DBTransaction = db) => {
  const song = await trx.select({ songId: songs.id }).from(songs).where(eq(songs.path, path));

  return song.length > 0;
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

