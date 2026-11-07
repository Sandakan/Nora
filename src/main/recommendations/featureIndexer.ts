import audioEngine, { type JsAudioFeatures } from '@main/core/audioEngine';
import { db } from '@main/db/db';
import { artists, artistsSongs, songAudioFeatures, songs } from '@main/db/schema';
import logger from '@main/logger';
import { and, eq, sql } from 'drizzle-orm';

export const CURRENT_FEATURE_VERSION = 1;

export interface VectorMetaInputs {
  bpm?: number | null;
  replayGainTrackGain?: number | null;
  durationSecs: number;
  year?: number | null;
  globalListeners?: number | null;
}

/**
 * Normalizes acoustic DSP features and library metadata into a 14-dimensional cube vector.
 * Each dimension is mapped and clamped to [0.0, 1.0].
 */
export const build14DVector = (dsp: JsAudioFeatures, meta: VectorMetaInputs): string => {
  const clamp = (val: number, min = 0.0, max = 1.0) => Math.min(max, Math.max(min, val));

  const dim1_rms = clamp(dsp.rmsEnergy);
  const dim2_crest = clamp(dsp.crestFactor / 20.0);
  const dim3_zcr = clamp(dsp.zeroCrossingRate);
  const dim4_centroid = clamp((dsp.spectralCentroid - 20.0) / 10000.0);
  const dim5_low = clamp(dsp.lowEnergyRatio);
  const dim6_mid = clamp(dsp.midEnergyRatio);
  const dim7_high = clamp(dsp.highEnergyRatio);
  const dim8_est_bpm = clamp((dsp.estimatedBpm - 60.0) / 140.0);
  const dim9_pulse = clamp(dsp.pulseClarity);

  const effectiveBpm = meta.bpm && meta.bpm > 0 ? meta.bpm : dsp.estimatedBpm;
  const dim10_bpm = clamp((effectiveBpm - 60.0) / 140.0);

  const dim11_replaygain =
    meta.replayGainTrackGain !== null && meta.replayGainTrackGain !== undefined
      ? clamp((meta.replayGainTrackGain + 15.0) / 30.0)
      : 0.5;

  const dim12_duration = clamp(meta.durationSecs / 600.0);
  const dim13_year =
    meta.year && meta.year > 0 ? clamp((meta.year - 1950.0) / 75.0) : 0.5;

  const listeners = meta.globalListeners ?? 0;
  const dim14_popularity = clamp(
    Math.log10(listeners + 1) / Math.log10(5000000 + 1)
  );

  const dims = [
    dim1_rms,
    dim2_crest,
    dim3_zcr,
    dim4_centroid,
    dim5_low,
    dim6_mid,
    dim7_high,
    dim8_est_bpm,
    dim9_pulse,
    dim10_bpm,
    dim11_replaygain,
    dim12_duration,
    dim13_year,
    dim14_popularity
  ];

  return `(${dims.map((d) => Number(d.toFixed(4))).join(',')})`;
};

/**
 * Extracts DSP features for a single song and persists the features + 14D vector.
 */
export const indexSongAudioFeatures = async (
  songId: number,
  filePath: string,
  trx: DB | DBTransaction = db
) => {
  try {
    const dsp = await audioEngine.analyzeAudioFeatures(filePath);

    const songRow = await trx.query.songs.findFirst({
      where: eq(songs.id, songId),
      columns: {
        id: true,
        duration: true,
        bpm: true,
        replayGainTrackGain: true,
        year: true
      }
    });

    if (!songRow) {
      return null;
    }

    // Check if existing record has globalListeners or globalPlaycount
    const existingFeature = await trx.query.songAudioFeatures.findFirst({
      where: eq(songAudioFeatures.songId, songId),
      columns: {
        globalListeners: true,
        globalPlaycount: true,
        lastfmSyncedAt: true
      }
    });

    const meta: VectorMetaInputs = {
      bpm: songRow.bpm,
      replayGainTrackGain: songRow.replayGainTrackGain,
      durationSecs: Number(songRow.duration),
      year: songRow.year,
      globalListeners: existingFeature?.globalListeners
    };

    const vectorStr = build14DVector(dsp, meta);

    const record = {
      songId,
      rmsEnergy: dsp.rmsEnergy,
      crestFactor: dsp.crestFactor,
      zeroCrossingRate: dsp.zeroCrossingRate,
      spectralCentroid: dsp.spectralCentroid,
      lowEnergyRatio: dsp.lowEnergyRatio,
      midEnergyRatio: dsp.midEnergyRatio,
      highEnergyRatio: dsp.highEnergyRatio,
      estimatedBpm: dsp.estimatedBpm,
      pulseClarity: dsp.pulseClarity,
      featureVector: vectorStr,
      featureVersion: CURRENT_FEATURE_VERSION,
      updatedAt: new Date()
    };

    await trx
      .insert(songAudioFeatures)
      .values(record)
      .onConflictDoUpdate({
        target: songAudioFeatures.songId,
        set: record
      });

    logger.debug('Indexed audio features for song', {
      songId,
      estimatedBpm: dsp.estimatedBpm,
      pulseClarity: dsp.pulseClarity
    });

    return record;
  } catch (error) {
    logger.warn('Failed to index audio features for song', {
      songId,
      filePath,
      error: String(error)
    });

    // Track failed attempts to prevent infinite retry busy-loops
    const attempts = (failedSongAttempts.get(songId) ?? 0) + 1;
    failedSongAttempts.set(songId, attempts);

    if (attempts >= MAX_INDEXING_ATTEMPTS) {
      logger.warn('Max indexing attempts reached for song; writing fallback features record', {
        songId,
        filePath
      });
      try {
        const fallbackDsp: JsAudioFeatures = {
          rmsEnergy: 0.0,
          crestFactor: 1.0,
          zeroCrossingRate: 0.0,
          spectralCentroid: 1000.0,
          lowEnergyRatio: 0.33,
          midEnergyRatio: 0.34,
          highEnergyRatio: 0.33,
          estimatedBpm: 120.0,
          pulseClarity: 0.0
        };
        const fallbackMeta: VectorMetaInputs = {
          durationSecs: 180
        };
        const fallbackVector = build14DVector(fallbackDsp, fallbackMeta);
        const fallbackRecord = {
          songId,
          rmsEnergy: 0.0,
          crestFactor: 1.0,
          zeroCrossingRate: 0.0,
          spectralCentroid: 1000.0,
          lowEnergyRatio: 0.33,
          midEnergyRatio: 0.34,
          highEnergyRatio: 0.33,
          estimatedBpm: 120.0,
          pulseClarity: 0.0,
          featureVector: fallbackVector,
          featureVersion: CURRENT_FEATURE_VERSION,
          updatedAt: new Date()
        };
        await trx
          .insert(songAudioFeatures)
          .values(fallbackRecord)
          .onConflictDoUpdate({
            target: songAudioFeatures.songId,
            set: fallbackRecord
          });
      } catch (fallbackErr) {
        logger.error('Failed to write fallback features record for song', {
          songId,
          error: String(fallbackErr)
        });
      }
    }

    return null;
  }
};

const MAX_INDEXING_ATTEMPTS = 3;
const failedSongAttempts = new Map<number, number>();
const inFlightPlaybackIndexing = new Set<number>();

/**
 * Opportunistically fingerprints a single song upon playback.
 * Runs independently of the bulk background indexer pause state after a 2-second grace period.
 * Skips immediately if the song already has up-to-date audio features or is already being analyzed.
 */
export const indexSongOnPlayback = async (songId: number, filePath: string): Promise<void> => {
  if (inFlightPlaybackIndexing.has(songId)) {
    return;
  }

  try {
    const existing = await db.query.songAudioFeatures.findFirst({
      where: and(
        eq(songAudioFeatures.songId, songId),
        sql`${songAudioFeatures.featureVersion} >= ${CURRENT_FEATURE_VERSION}`
      ),
      columns: {
        songId: true
      }
    });

    if (existing) {
      return;
    }

    inFlightPlaybackIndexing.add(songId);

    // 2-second grace period to ensure initial audio buffer initialization and UI playback start are undisturbed
    await new Promise((resolve) => setTimeout(resolve, 2000));

    logger.debug('Opportunistically indexing audio features for playing song', {
      songId,
      filePath
    });

    const record = await indexSongAudioFeatures(songId, filePath);
    if (record) {
      await broadcastIndexingStatus();
    }
  } catch (err) {
    logger.debug('Playback opportunistic feature indexing failed or was aborted', {
      songId,
      error: String(err)
    });
  } finally {
    inFlightPlaybackIndexing.delete(songId);
  }
};

let isIndexerRunning = false;
let isPaused = false;
let stopRequested = false;
let currentSongInfo: {
  songId: number;
  title: string;
  artists?: string;
} | null = null;

export const broadcastIndexingStatus = async (customStatus?: FeatureIndexingStatus) => {
  try {
    const { mainWindow } = await import('@main/main');
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      const status = customStatus ?? (await getFeatureIndexingStatus());
      mainWindow.webContents.send('app/recommendations/indexingProgress', status);
    }
  } catch {
    // Ignore error in environments without mainWindow
  }
};

export const getFeatureIndexingStatus = async (): Promise<FeatureIndexingStatus> => {
  try {
    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(songs)
      .where(eq(songs.isBlacklisted, false));
    const totalSongs = totalRes?.count ?? 0;

    const [indexedRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(songAudioFeatures)
      .innerJoin(songs, eq(songAudioFeatures.songId, songs.id))
      .where(
        and(
          eq(songs.isBlacklisted, false),
          sql`${songAudioFeatures.featureVersion} >= ${CURRENT_FEATURE_VERSION}`
        )
      );
    const indexedSongs = indexedRes?.count ?? 0;

    const remainingSongs = Math.max(0, totalSongs - indexedSongs);
    const percentage = totalSongs > 0 ? Math.round((indexedSongs / totalSongs) * 100) : 100;

    let status: 'idle' | 'indexing' | 'paused' | 'complete' = 'idle';
    if (isPaused) {
      status = 'paused';
    } else if (isIndexerRunning && remainingSongs > 0) {
      status = 'indexing';
    } else if (remainingSongs === 0 && totalSongs > 0) {
      status = 'complete';
    } else {
      status = 'idle';
    }

    return {
      status,
      totalSongs,
      indexedSongs,
      remainingSongs,
      percentage,
      currentSong: status === 'indexing' ? currentSongInfo : null
    };
  } catch (error) {
    logger.warn('Failed to calculate feature indexing status', { error: String(error) });
    return {
      status: isPaused ? 'paused' : isIndexerRunning ? 'indexing' : 'idle',
      totalSongs: 0,
      indexedSongs: 0,
      remainingSongs: 0,
      percentage: 0,
      currentSong: null
    };
  }
};

export const pauseBackgroundFeatureIndexer = () => {
  isPaused = true;
  currentSongInfo = null;
  broadcastIndexingStatus();
};

export const resumeBackgroundFeatureIndexer = () => {
  isPaused = false;
  if (!isIndexerRunning) {
    startBackgroundFeatureIndexer();
  } else {
    broadcastIndexingStatus();
  }
};

export const reindexAudioFeatures = async (mode: 'missing' | 'all' = 'missing') => {
  if (mode === 'all') {
    logger.info('Wiping audio features for full library re-indexing...');
    await db.delete(songAudioFeatures);
  }
  failedSongAttempts.clear();
  isPaused = false;
  broadcastIndexingStatus();
  if (!isIndexerRunning) {
    startBackgroundFeatureIndexer();
  }
};

/**
 * Starts the background audio feature indexer. Processes unindexed songs in small batches
 * with non-blocking yields to avoid degrading UI performance or audio playback.
 */
export const startBackgroundFeatureIndexer = async () => {
  if (isIndexerRunning) return;
  isIndexerRunning = true;
  stopRequested = false;

  logger.info('Starting background recommendation feature indexer...');

  try {
    while (!stopRequested) {
      if (isPaused) {
        currentSongInfo = null;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Find up to 3 unindexed songs
      const unindexed = await db
        .select({
          id: songs.id,
          title: songs.title,
          path: songs.path
        })
        .from(songs)
        .leftJoin(songAudioFeatures, eq(songs.id, songAudioFeatures.songId))
        .where(
          and(
            eq(songs.isBlacklisted, false),
            sql`(${songAudioFeatures.songId} IS NULL OR ${songAudioFeatures.featureVersion} < ${CURRENT_FEATURE_VERSION})`
          )
        )
        .limit(3);

      if (unindexed.length === 0) {
        currentSongInfo = null;
        broadcastIndexingStatus();
        // All songs indexed, sleep for 30s before checking again
        await new Promise((resolve) => setTimeout(resolve, 30000));
        continue;
      }

      for (const item of unindexed) {
        if (stopRequested || isPaused) break;

        let artistsString = '';
        try {
          const artistRows = await db
            .select({ name: artists.name })
            .from(artistsSongs)
            .innerJoin(artists, eq(artistsSongs.artistId, artists.id))
            .where(eq(artistsSongs.songId, item.id));
          artistsString = artistRows.map((a) => a.name).join(', ');
        } catch {
          // ignore error fetching artist names
        }

        currentSongInfo = {
          songId: item.id,
          title: item.title,
          artists: artistsString || undefined
        };

        broadcastIndexingStatus();

        await indexSongAudioFeatures(item.id, item.path);

        currentSongInfo = null;
        broadcastIndexingStatus();

        // Yield between songs
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  } catch (err) {
    logger.error('Background feature indexer encountered error', { error: String(err) });
  } finally {
    isIndexerRunning = false;
    currentSongInfo = null;
    broadcastIndexingStatus();
  }
};

export const stopBackgroundFeatureIndexer = () => {
  stopRequested = true;
};

// End of feature indexer logic
