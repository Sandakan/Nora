import { db } from '@db/db';
import { artworks, palettes, paletteSwatches } from '../schema';
import { and, eq, lte, isNull } from 'drizzle-orm';

export const getLowResArtworksWithoutPalettes = async (trx: DB | DBTransaction = db) => {
  const res = await trx
    .select({
      id: artworks.id,
      path: artworks.path,
      width: artworks.width,
      height: artworks.height,
      source: artworks.source,
      createdAt: artworks.createdAt,
      paletteId: palettes.id
    })
    .from(artworks)
    .leftJoin(palettes, eq(artworks.id, palettes.artworkId))
    .where(
      and(
        lte(artworks.width, 100),
        lte(artworks.height, 100),
        eq(artworks.source, 'LOCAL'),
        isNull(palettes.id)
      )
    );

  return res;
};

export const createArtworkPalette = async (
  data: { artworkId: number; swatches: Omit<typeof paletteSwatches.$inferInsert, 'paletteId'>[] },
  trx: DBTransaction
) => {
  const palette = await trx.insert(palettes).values({ artworkId: data.artworkId }).returning();

  const parsedSwatches = data.swatches.map((swatch) => ({ ...swatch, paletteId: palette[0].id }));

  const res = await trx.insert(paletteSwatches).values(parsedSwatches).returning();

  return { palette, swatches: res };
};
