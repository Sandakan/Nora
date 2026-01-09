import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db';
import { musicFolders } from '../schema';
import { basename } from 'path';

export const getAllFolders = async (trx: DB | DBTransaction = db) => {
  return trx.select().from(musicFolders);
};

export const getFolderFromPath = async (path: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select().from(musicFolders).where(eq(musicFolders.path, path));

  return data.at(0);
};

export const getFolderStructure = async (
  parentId: number | null = null,
  trx: DB | DBTransaction = db
): Promise<FolderStructure[]> => {
  // Fetch folders with the given parentId
  const folders = await trx
    .select()
    .from(musicFolders)
    .where(parentId === null ? isNull(musicFolders.parentId) : eq(musicFolders.parentId, parentId));

  const result: FolderStructure[] = [];

  for (const folder of folders) {
    const subFolders = await getFolderStructure(folder.id);

    result.push({
      path: folder.path,
      stats: {
        lastModifiedDate: folder.lastModifiedAt!,
        lastChangedDate: folder.lastChangedAt!,
        fileCreatedDate: folder.folderCreatedAt!,
        lastParsedDate: folder.lastParsedAt!
      },
      subFolders
    });
  }

  return result;
};

export const getAllFolderStructures = async (
  trx: DB | DBTransaction = db
): Promise<FolderStructure[]> => {
  const rootFolders = await trx.select().from(musicFolders).where(isNull(musicFolders.parentId));

  const structures = await Promise.all(
    rootFolders.map(async (folder) => ({
      path: folder.path,
      stats: {
        lastModifiedDate: folder.lastModifiedAt!,
        lastChangedDate: folder.lastChangedAt!,
        fileCreatedDate: folder.folderCreatedAt!,
        lastParsedDate: folder.lastParsedAt!
      },
      subFolders: await getFolderStructure(folder.id, trx)
    }))
  );

  return structures;
};

export const saveAllFolderStructures = async (
  structures: FolderStructure[],
  trx: DBTransaction
) => {
  const addedFolders: (typeof musicFolders.$inferSelect)[] = [];
  const updatedFolders: (typeof musicFolders.$inferSelect)[] = [];

  for (const structure of structures) {
    const result = await createOrUpdateFolderStructure(structure, trx, undefined);

    addedFolders.push(...result.addedFolders);
    updatedFolders.push(...result.updatedFolders);
  }

  return { addedFolders, updatedFolders };
};

const createOrUpdateFolderStructure = async (
  structure: FolderStructure,
  trx: DBTransaction,
  parentId?: number
) => {
  const addedFolders: (typeof musicFolders.$inferSelect)[] = [];
  const updatedFolders: (typeof musicFolders.$inferSelect)[] = [];

  const currentFolderData = {
    name: basename(structure.path),
    path: structure.path,
    lastModifiedAt: structure.stats.lastModifiedDate,
    lastChangedAt: structure.stats.lastChangedDate,
    folderCreatedAt: structure.stats.fileCreatedDate,
    lastParsedAt: structure.stats.lastParsedDate,
    parentId
  };

  const folder = await trx
    .select()
    .from(musicFolders)
    .where(
      and(
        eq(musicFolders.path, structure.path),
        parentId === null
          ? isNull(musicFolders.parentId)
          : eq(musicFolders.parentId, parentId as number)
      )
    )
    .limit(1);
  const selectedFolder = folder.at(0);

  if (selectedFolder) {
    const data = await trx
      .update(musicFolders)
      .set(currentFolderData)
      .where(eq(musicFolders.id, selectedFolder.id))
      .returning();

    updatedFolders.push(data[0]);
  } else {
    const addedFolder = await trx.insert(musicFolders).values(currentFolderData).returning();

    addedFolders.push(addedFolder[0]);
  }

  if (structure.subFolders.length > 0) {
    for (const subFolder of structure.subFolders) {
      const res = await createOrUpdateFolderStructure(subFolder, trx, folder[0]?.id);

      addedFolders.push(...res.addedFolders);
      updatedFolders.push(...res.updatedFolders);
    }
  }

  return { addedFolders, updatedFolders };
};

const getMusicFolder = async (
  parentId: number | null = null,
  trx: DB | DBTransaction = db
): Promise<MusicFolder[]> => {
  // Fetch folders with the given parentId
  const folders = await trx.query.musicFolders.findMany({
    where: parentId === null ? isNull(musicFolders.parentId) : eq(musicFolders.parentId, parentId),
    with: {
      songs: {
        columns: { id: true }
      }
    }
  });
  // .from(musicFolders)
  // .where(parentId === null ? isNull(musicFolders.parentId) : eq(musicFolders.parentId, parentId));

  const result: MusicFolder[] = [];

  for (const folder of folders) {
    const subFolders = await getMusicFolder(folder.id);

    result.push({
      path: folder.path,
      stats: {
        lastModifiedDate: folder.lastModifiedAt!,
        lastChangedDate: folder.lastChangedAt!,
        fileCreatedDate: folder.folderCreatedAt!,
        lastParsedDate: folder.lastParsedAt!
      },
      songIds: folder.songs.map((song) => song.id),
      isBlacklisted: folder.isBlacklisted,
      subFolders
    });
  }

  return result;
};

export const getAllMusicFolders = async (trx: DB | DBTransaction = db): Promise<MusicFolder[]> => {
  const rootFolders = await trx.query.musicFolders.findMany({
    where: isNull(musicFolders.parentId),
    with: {
      songs: {
        columns: { id: true }
      }
    }
  });

  const structures = await Promise.all(
    rootFolders.map(
      async (folder) =>
        ({
          path: folder.path,
          stats: {
            lastModifiedDate: folder.lastModifiedAt!,
            lastChangedDate: folder.lastChangedAt!,
            fileCreatedDate: folder.folderCreatedAt!,
            lastParsedDate: folder.lastParsedAt!
          },
          songIds: folder.songs.map((song) => song.id),
          isBlacklisted: folder.isBlacklisted,
          subFolders: await getMusicFolder(folder.id, trx)
        }) satisfies MusicFolder
    )
  );

  return structures;
};

export const getFoldersByIds = async (ids: number[], trx: DB | DBTransaction = db) => {
  const folders = await trx.query.musicFolders.findMany({
    where: (f) => inArray(f.id, ids)
  });

  return folders;
};

export const getFoldersByPaths = async (paths: string[], trx: DB | DBTransaction = db) => {
  const folders = await trx.query.musicFolders.findMany({
    where: (f) => inArray(f.path, paths)
  });

  return folders;
};

export const getBlacklistedFolders = async () => {
  const data = await db.query.musicFolders.findMany({
    where: (f) => eq(f.isBlacklisted, true)
  });

  return data;
};

export const isFolderBlacklisted = async (folderId: number) => {
  const data = await db.query.musicFolders.findFirst({
    where: eq(musicFolders.id, folderId)
  });
  return !!data;
};

export const addFoldersToBlacklist = async (folderIds: number[]) => {
  await db
    .update(musicFolders)
    .set({ isBlacklisted: true, isBlacklistedUpdatedAt: new Date() })
    .where(inArray(musicFolders.id, folderIds));
};
