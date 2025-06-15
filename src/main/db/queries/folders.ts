import { eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { musicFolders } from '../schema';

export const getAllFolders = async (trx: DB | DBTransaction = db) => {
  return trx.select().from(musicFolders);
};

export const getFolderStructure = async (
  parentId: number | null = null
): Promise<FolderStructure[]> => {
  // Fetch folders with the given parentId
  const folders = await db
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

export const getAllFolderStructures = async (): Promise<FolderStructure[]> => {
  const rootFolders = await db.select().from(musicFolders).where(isNull(musicFolders.parentId));

  const structures = await Promise.all(
    rootFolders.map(async (folder) => ({
      path: folder.path,
      stats: {
        lastModifiedDate: folder.lastModifiedAt!,
        lastChangedDate: folder.lastChangedAt!,
        fileCreatedDate: folder.folderCreatedAt!,
        lastParsedDate: folder.lastParsedAt!
      },
      subFolders: await getFolderStructure(folder.id)
    }))
  );

  return structures;
};
