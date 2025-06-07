import { db } from '../db';
import { albumsArtworks, artistsArtworks, artworks, artworkSourceEnum } from '../schema';

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
