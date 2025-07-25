import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import {
  albumsArtworks,
  artistsArtworks,
  artworks,
  artworkSourceEnum,
  artworksSongs
} from '../schema';

export const saveArtworks = async (
  data: {
    path: string;
    width: number;
    height: number;
    source: (typeof artworkSourceEnum.enumValues)[number];
  }[],
  trx: DB | DBTransaction = db
) => {
  const res = await trx.insert(artworks).values(data).returning();

  return res;
};

export const linkArtworksToSong = async (
  data: (typeof artworksSongs.$inferInsert)[],
  trx: DB | DBTransaction = db
) => {
  return trx.insert(artworksSongs).values(data).returning();
};

export const syncSongArtworks = async (
  songId: number,
  artworksIds: number[],
  trx: DB | DBTransaction = db
) => {
  // Get current artwork ids for the song
  const current = await trx
    .select({ artworkId: artworksSongs.artworkId })
    .from(artworksSongs)
    .where(eq(artworksSongs.songId, songId));

  const currentIds = current.map((row) => row.artworkId);

  // Determine which to add and which to remove
  const toAdd = artworksIds.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id) => !artworksIds.includes(id));

  // Remove unlinked
  if (toRemove.length > 0) {
    await trx.delete(artworksSongs).where(
      and(eq(artworksSongs.songId, songId), inArray(artworksSongs.artworkId, toRemove))
      // @ts-ignore: Drizzle ORM may require a custom 'in' helper for array filtering
    );
  }

  // Add new links
  if (toAdd.length > 0) {
    await trx.insert(artworksSongs).values(toAdd.map((artworkId) => ({ songId, artworkId })));
  }

  // Return the final set
  return await trx
    .select({ artworkId: artworksSongs.artworkId })
    .from(artworksSongs)
    .where(eq(artworksSongs.songId, songId));
};

export const linkArtworksToAlbum = async (
  data: (typeof albumsArtworks.$inferInsert)[],
  trx: DB | DBTransaction = db
) => {
  return trx.insert(albumsArtworks).values(data).returning();
};

export const linkArtworksToArtist = async (
  data: (typeof artistsArtworks.$inferInsert)[],
  trx: DB | DBTransaction = db
) => {
  return trx.insert(artistsArtworks).values(data).returning();
};
