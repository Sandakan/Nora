import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { db } from '@db/db';
import { songLyrics, songs as songTable } from '@db/schema';
import { getLrcFilePaths } from '@main/core/getSongLyrics';
import { getUserSettings } from '@main/db/queries/settings';
import logger from '@main/logger';
import { eq } from 'drizzle-orm';

import { appPreferences } from '../../../../package.json';
import parseLyrics from '../../../common/parseLyrics';

const { metadataEditingSupportedExtensions } = appPreferences;

type LyricsSource = 'LRC' | 'EMBEDDED' | 'BOTH';

const extractPlainText = (parsedLyrics: LyricLine[]): string => {
  return parsedLyrics
    .map((line) => {
      const { originalText } = line;
      if (typeof originalText === 'string') return originalText;
      return originalText.map((w) => w.text).join('');
    })
    .filter((text) => text.trim().length > 0)
    .join('\n');
};

// Read-result tri-state:
// - string  => lyrics text found
// - undefined => definitively not present (no tag / no file)
// - null    => read or parse error (keep existing index, don't delete)
type LyricReadResult = string | undefined | null;

const readEmbeddedLyrics = async (songPath: string): Promise<LyricReadResult> => {
  const songExt = path.extname(songPath).replace('.', '');
  if (!metadataEditingSupportedExtensions.includes(songExt)) return undefined;

  try {
    const { withFileHandle } = await import('@main/utils/withFileHandle');
    const storedLyrics = await withFileHandle(songPath, (file) => file.tag.lyrics);
    if (!storedLyrics) return undefined;
    const parsed = parseLyrics(storedLyrics);
    return extractPlainText(parsed.parsedLyrics);
  } catch (error) {
    logger.error(`Failed to read embedded lyrics for ${songPath}`, { error });
    return null;
  }
};

const readLrcLyrics = async (
  songPath: string,
  customLrcFilesSaveLocation?: string | null
): Promise<LyricReadResult> => {
  const lrcFilePaths = getLrcFilePaths(songPath, customLrcFilesSaveLocation);

  let encounteredError = false;
  for (const lrcPath of lrcFilePaths) {
    try {
      const data = await readFile(lrcPath, { encoding: 'utf-8' });
      if (data) {
        const parsed = parseLyrics(data);
        return extractPlainText(parsed.parsedLyrics);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
        encounteredError = true;
        logger.error(`Failed to read LRC file ${lrcPath}`, { error });
      }
    }
  }
  return encounteredError ? null : undefined;
};

export const upsertSongLyricsFromText = async (
  songId: number,
  lyricsText: string,
  source: LyricsSource,
  trx: typeof db = db
): Promise<void> => {
  if (!lyricsText || lyricsText.trim().length === 0) return;

  await trx
    .insert(songLyrics)
    .values({ songId, lyricsText, source })
    .onConflictDoUpdate({
      target: songLyrics.songId,
      set: { lyricsText, source, updatedAt: new Date() }
    });
};

export type LyricsIndexResult = 'indexed' | 'absent' | 'read-error';

// Configurable indexing policy: number of songs processed per backfill batch.
const LYRICS_BACKFILL_BATCH_SIZE = 10;

/**
 * Sums backfill batch results. A fulfilled 'read-error' counts as a failure so isLyricIndexBuilt is
 * only set when every song was indexed or confirmed absent (a song with no lyrics is a valid
 * completed state). Pure and unit-testable.
 */
export const countBackfillResults = (
  results: PromiseSettledResult<LyricsIndexResult>[]
): { processed: number; indexed: number; failed: number } => {
  let indexed = 0;
  let processed = 0;
  let failed = 0;
  for (const result of results) {
    if (result.status === 'fulfilled') {
      processed += 1;
      if (result.value === 'indexed') indexed += 1;
      else if (result.value === 'read-error') failed += 1;
      // 'absent' is a valid completed state - not a failure.
    } else {
      failed += 1;
    }
  }
  return { processed, indexed, failed };
};

export const upsertSongLyrics = async (
  songId: number,
  songPath: string,
  customLrcFilesSaveLocation?: string | null,
  trx: typeof db = db
): Promise<LyricsIndexResult> => {
  const [embedded, lrc] = await Promise.all([
    readEmbeddedLyrics(songPath),
    readLrcLyrics(songPath, customLrcFilesSaveLocation)
  ]);

  // null = read/parse error on at least one source; keep existing index, don't delete
  if (embedded === null || lrc === null) {
    logger.warn(
      `Skipping lyrics index update for song ${songId} due to read error; keeping existing entry.`
    );
    return 'read-error';
  }

  const texts: string[] = [];
  if (embedded) texts.push(embedded);
  if (lrc) texts.push(lrc);

  if (texts.length === 0) {
    await removeSongLyrics(songId, trx);
    return 'absent';
  }

  const lyricsText = texts.join('\n');
  let source: LyricsSource;
  if (embedded && lrc) source = 'BOTH';
  else if (embedded) source = 'EMBEDDED';
  else source = 'LRC';

  await upsertSongLyricsFromText(songId, lyricsText, source, trx);
  return 'indexed';
};

export const removeSongLyrics = async (songId: number, trx: typeof db = db): Promise<void> => {
  await trx.delete(songLyrics).where(eq(songLyrics.songId, songId));
};

export const indexAllLyrics = async (): Promise<{ allSucceeded: boolean }> => {
  logger.info('Starting lyrics index backfill.');
  const songs = await db.select({ id: songTable.id, path: songTable.path }).from(songTable);
  const { customLrcFilesSaveLocation } = await getUserSettings();

  let indexed = 0;
  let processed = 0;
  let failed = 0;
  for (let i = 0; i < songs.length; i += LYRICS_BACKFILL_BATCH_SIZE) {
    const batch = songs.slice(i, i + LYRICS_BACKFILL_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((song) => upsertSongLyrics(song.id, song.path, customLrcFilesSaveLocation))
    );
    const counts = countBackfillResults(results);
    processed += counts.processed;
    indexed += counts.indexed;
    failed += counts.failed;
    for (let j = 0; j < results.length; j += 1) {
      const result = results[j];
      if (result.status === 'rejected') {
        logger.error(`Failed to index lyrics for song ${batch[j].id}`, { error: result.reason });
      } else if (result.value === 'read-error') {
        logger.error(`Failed to index lyrics for song ${batch[j].id} (read error).`);
      }
    }
  }

  logger.info(
    `Lyrics index backfill complete. Indexed ${indexed} songs, processed ${processed} of ${songs.length}, failed ${failed}.`
  );
  return { allSucceeded: failed === 0 };
};
