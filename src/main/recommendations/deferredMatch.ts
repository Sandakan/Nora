import { db } from '@main/db/db';
import { artistSimilarities, songSimilarities } from '@main/db/schema';
import logger from '@main/logger';
import { and, eq, isNull, or } from 'drizzle-orm';

/**
 * Resolves any pending deferred song similarity edges matching a newly added or updated song
 * by MBID or (targetTitleCI + targetArtistCI).
 */
export const resolveDeferredSongSimilarities = async (
  song: {
    id: number;
    title: string;
    mbid?: string | null;
    artistNames?: string[];
  },
  trx: DB | DBTransaction = db
) => {
  try {
    const conditions = [];

    if (song.mbid) {
      conditions.push(eq(songSimilarities.targetMbid, song.mbid));
    }

    if (song.artistNames && song.artistNames.length > 0) {
      for (const artistName of song.artistNames) {
        if (artistName.trim()) {
          conditions.push(
            and(
              eq(songSimilarities.targetTitleCI, song.title.trim()),
              eq(songSimilarities.targetArtistCI, artistName.trim())
            )
          );
        }
      }
    } else {
      conditions.push(eq(songSimilarities.targetTitleCI, song.title.trim()));
    }

    if (conditions.length > 0) {
      await trx
        .update(songSimilarities)
        .set({ targetSongId: song.id, updatedAt: new Date() })
        .where(and(isNull(songSimilarities.targetSongId), or(...conditions)));
    }
  } catch (err) {
    logger.warn('Failed to resolve deferred song similarities', {
      error: String(err),
      songId: song.id
    });
  }
};

/**
 * Resolves any pending deferred artist similarity edges matching a newly added or updated artist
 * by MBID or targetArtistNameCI.
 */
export const resolveDeferredArtistSimilarities = async (
  artist: {
    id: number;
    name: string;
    mbid?: string | null;
  },
  trx: DB | DBTransaction = db
) => {
  try {
    const conditions = [];

    if (artist.mbid) {
      conditions.push(eq(artistSimilarities.targetMbid, artist.mbid));
    }

    conditions.push(eq(artistSimilarities.targetArtistNameCI, artist.name.trim()));

    await trx
      .update(artistSimilarities)
      .set({ targetArtistId: artist.id, updatedAt: new Date() })
      .where(and(isNull(artistSimilarities.targetArtistId), or(...conditions)));
  } catch (err) {
    logger.warn('Failed to resolve deferred artist similarities', {
      error: String(err),
      artistId: artist.id
    });
  }
};
