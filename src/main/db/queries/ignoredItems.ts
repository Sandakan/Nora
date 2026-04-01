import { eq, inArray } from 'drizzle-orm';

import { db } from '../db';
import { ignoredArtists, ignoredDuplicateMetadata, ignoredFeaturingArtists } from '../schema';

// ============================================================================
// Ignored Artists Queries
// ============================================================================

export const getIgnoredArtists = async () => {
  return await db.select().from(ignoredArtists);
};

export const addIgnoredArtist = async (artistId: number) => {
  await db.insert(ignoredArtists).values({
    artistId
  });
};

export const removeIgnoredArtist = async (artistId: number) => {
  await db.delete(ignoredArtists).where(eq(ignoredArtists.artistId, artistId));
};

export const removeMultipleIgnoredArtists = async (artistIds: number[]) => {
  if (artistIds.length === 0) return;

  await db.delete(ignoredArtists).where(inArray(ignoredArtists.artistId, artistIds));
};

export const isArtistIgnored = async (artistId: number) => {
  const result = await db
    .select()
    .from(ignoredArtists)
    .where(eq(ignoredArtists.artistId, artistId))
    .limit(1);

  return result.length > 0;
};

// ============================================================================
// Ignored Featuring Artists Queries
// ============================================================================

export const getIgnoredFeaturingArtists = async () => {
  return await db.select().from(ignoredFeaturingArtists);
};

export const addIgnoredFeaturingArtist = async (artistId: number) => {
  await db.insert(ignoredFeaturingArtists).values({
    artistId
  });
};

export const removeIgnoredFeaturingArtist = async (artistId: number) => {
  await db.delete(ignoredFeaturingArtists).where(eq(ignoredFeaturingArtists.artistId, artistId));
};

export const removeMultipleIgnoredFeaturingArtists = async (artistIds: number[]) => {
  if (artistIds.length === 0) return;

  await db
    .delete(ignoredFeaturingArtists)
    .where(inArray(ignoredFeaturingArtists.artistId, artistIds));
};

export const isFeaturingArtistIgnored = async (artistId: number) => {
  const result = await db
    .select()
    .from(ignoredFeaturingArtists)
    .where(eq(ignoredFeaturingArtists.artistId, artistId))
    .limit(1);

  return result.length > 0;
};

// ============================================================================
// Ignored Duplicate Metadata Queries
// ============================================================================

export const getIgnoredDuplicateMetadata = async () => {
  return await db.select().from(ignoredDuplicateMetadata);
};

export const getIgnoredDuplicatesForGroup = async (duplicateGroupId: string) => {
  return await db
    .select()
    .from(ignoredDuplicateMetadata)
    .where(eq(ignoredDuplicateMetadata.duplicateGroupId, duplicateGroupId));
};

export const addIgnoredDuplicate = async (duplicateGroupId: string, songId: number) => {
  await db.insert(ignoredDuplicateMetadata).values({
    duplicateGroupId,
    songId
  });
};

export const removeIgnoredDuplicate = async (duplicateGroupId: string, songId: number) => {
  await db
    .delete(ignoredDuplicateMetadata)
    .where(
      eq(ignoredDuplicateMetadata.duplicateGroupId, duplicateGroupId) &&
        eq(ignoredDuplicateMetadata.songId, songId)
    );
};

export const removeIgnoredDuplicatesForGroup = async (duplicateGroupId: string) => {
  await db
    .delete(ignoredDuplicateMetadata)
    .where(eq(ignoredDuplicateMetadata.duplicateGroupId, duplicateGroupId));
};

export const isAllIgnoredDuplicates = async (duplicateGroupId: string, totalCount: number) => {
  const result = await db
    .select()
    .from(ignoredDuplicateMetadata)
    .where(eq(ignoredDuplicateMetadata.duplicateGroupId, duplicateGroupId));

  return result.length === totalCount;
};
