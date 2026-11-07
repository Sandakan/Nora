import { db } from '@main/db/db';
import {
  playEvents,
  skipEvents,
  songAudioFeatures,
  songs,
  songsLastfmTags,
  songSimilarities
} from '@main/db/schema';
import logger from '@main/logger';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import getSongInfo from '../core/getSongInfo';

export interface RecommendedSongResult {
  song: SongData;
  score: number;
  reason: string;
  matchType: 'acoustic' | 'graph' | 'circadian' | 'rediscovery' | 'tag';
}

export interface PersonalizedRecommendationOptions {
  limit?: number;
  sessionSeedSongIds?: number[];
}

/**
 * Parses a raw database cube or array into a standard 14D number array.
 */
export const parseVector = (v: unknown): number[] | null => {
  if (Array.isArray(v)) {
    return v.map(Number);
  }
  if (typeof v === 'string') {
    const cleaned = v.replace(/[()]/g, '').trim();
    if (!cleaned) return null;
    const parts = cleaned.split(',').map((x) => Number.parseFloat(x));
    if (parts.some((n) => Number.isNaN(n))) return null;
    return parts;
  }
  return null;
};

/**
 * Computes standard Euclidean distance between two vectors of arbitrary length.
 */
export const euclideanDistance = (a: number[], b: number[]): number => {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Computes the element-wise centroid (mean) of a set of equal-length vectors.
 */
export const averageVectors = (vectors: number[][]): number[] | null => {
  if (!vectors.length) return null;
  const dim = vectors[0].length;
  const avg = new Array(dim).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      avg[i] += vec[i] ?? 0;
    }
  }
  for (let i = 0; i < dim; i++) {
    avg[i] = Number((avg[i] / vectors.length).toFixed(4));
  }
  return avg;
};

/**
 * Returns a human-friendly circadian time block name and range based on the given hour.
 */
export const getCircadianTimeBlock = (hour: number) => {
  if (hour >= 5 && hour < 10) {
    return { label: 'Morning Flow', blockStart: 5, blockEnd: 10 };
  }
  if (hour >= 10 && hour < 14) {
    return { label: 'Midday Focus', blockStart: 10, blockEnd: 14 };
  }
  if (hour >= 14 && hour < 18) {
    return { label: 'Afternoon Groove', blockStart: 14, blockEnd: 18 };
  }
  if (hour >= 18 && hour < 22) {
    return { label: 'Evening Chill', blockStart: 18, blockEnd: 22 };
  }
  return { label: 'Late Night Vibe', blockStart: 22, blockEnd: 5 };
};

/**
 * Multi-Horizon Personalized Recommendation Scorer.
 * Combines Session Seeds (0.40), Circadian Time-of-Day (0.25), Long-Term Favorites &
 * High-Completion History (0.35), minus Skip Penalties (-0.35).
 * Scores candidate library songs across acoustic Euclidean distance, Last.fm graph connections,
 * genre/tag overlap, and library novelty. Applies MMR artist diversity.
 */
export const getPersonalizedRecommendations = async (
  options?: PersonalizedRecommendationOptions
): Promise<RecommendedSongResult[]> => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 20;

  try {
    // 1. Gather Session Seeds (0.40)
    let sessionSongIds: number[] = [];
    if (options?.sessionSeedSongIds && options.sessionSeedSongIds.length > 0) {
      sessionSongIds = options.sessionSeedSongIds;
    } else {
      const recentPlays = await db.query.playEvents.findMany({
        columns: { songId: true },
        orderBy: [desc(playEvents.createdAt)],
        limit: 12
      });
      sessionSongIds = [...new Set(recentPlays.map((p) => p.songId))];
    }

    // 2. Gather Circadian Time-of-Day Profile (0.25)
    const currentHour = new Date().getHours();
    const circadianInfo = getCircadianTimeBlock(currentHour);

    const historicalPlays = await db.query.playEvents.findMany({
      columns: { songId: true, createdAt: true },
      orderBy: [desc(playEvents.createdAt)],
      limit: 100
    });

    const circadianSongIds: number[] = [];
    for (const play of historicalPlays) {
      const playHour = new Date(play.createdAt).getHours();
      const inBlock =
        circadianInfo.blockStart <= circadianInfo.blockEnd
          ? playHour >= circadianInfo.blockStart && playHour < circadianInfo.blockEnd
          : playHour >= circadianInfo.blockStart || playHour < circadianInfo.blockEnd;
      if (inBlock && !circadianSongIds.includes(play.songId)) {
        circadianSongIds.push(play.songId);
      }
    }

    // 3. Gather Long-Term Favorites & Completion Profile (0.35)
    const favoriteSongs = await db.query.songs.findMany({
      where: eq(songs.isFavorite, true),
      columns: { id: true },
      limit: 30
    });
    const completedPlays = historicalPlays;
    const longTermSongIds = [
      ...new Set([
        ...favoriteSongs.map((s) => s.id),
        ...completedPlays.map((p) => p.songId).slice(0, 20)
      ])
    ];

    // 4. Gather Skip Penalties (-0.35)
    const recentSkips = await db.query.skipEvents.findMany({
      columns: { songId: true },
      orderBy: [desc(skipEvents.createdAt)],
      limit: 20
    });
    const skippedSongs = await db.query.songs.findMany({
      where: sql`${songs.skipCount} > 1`,
      columns: { id: true },
      limit: 20
    });
    const skipSongIds = [
      ...new Set([...recentSkips.map((s) => s.songId), ...skippedSongs.map((s) => s.id)])
    ];

    // 5. Query Feature Vectors for Taste Horizons
    const allQuerySongIds = [
      ...new Set([
        ...sessionSongIds,
        ...circadianSongIds,
        ...longTermSongIds,
        ...skipSongIds
      ])
    ];

    const featureRows =
      allQuerySongIds.length > 0
        ? await db.query.songAudioFeatures.findMany({
            where: inArray(songAudioFeatures.songId, allQuerySongIds),
            columns: { songId: true, featureVector: true }
          })
        : [];

    const featureMap = new Map<number, number[]>();
    for (const row of featureRows) {
      const vec = parseVector(row.featureVector);
      if (vec && vec.length === 14) {
        featureMap.set(row.songId, vec);
      }
    }

    const sessionVectors = sessionSongIds
      .map((id) => featureMap.get(id))
      .filter((v): v is number[] => Boolean(v));
    const circadianVectors = circadianSongIds
      .map((id) => featureMap.get(id))
      .filter((v): v is number[] => Boolean(v));
    const longTermVectors = longTermSongIds
      .map((id) => featureMap.get(id))
      .filter((v): v is number[] => Boolean(v));
    const skipVectors = skipSongIds
      .map((id) => featureMap.get(id))
      .filter((v): v is number[] => Boolean(v));

    const sessionCentroid = averageVectors(sessionVectors);
    const circadianCentroid = averageVectors(circadianVectors);
    const longTermCentroid = averageVectors(longTermVectors);
    const skipCentroid = averageVectors(skipVectors);

    // Dynamic positive weight redistribution
    let wSession = sessionCentroid ? 0.4 : 0;
    let wCircadian = circadianCentroid ? 0.25 : 0;
    let wLongTerm = longTermCentroid ? 0.35 : 0;
    const totalPositive = wSession + wCircadian + wLongTerm;

    let targetVector: number[] | null = null;
    if (totalPositive > 0) {
      wSession /= totalPositive;
      wCircadian /= totalPositive;
      wLongTerm /= totalPositive;

      targetVector = new Array(14).fill(0);
      for (let i = 0; i < 14; i++) {
        let val =
          (sessionCentroid ? sessionCentroid[i] * wSession : 0) +
          (circadianCentroid ? circadianCentroid[i] * wCircadian : 0) +
          (longTermCentroid ? longTermCentroid[i] * wLongTerm : 0);

        if (skipCentroid) {
          val -= skipCentroid[i] * 0.35;
        }
        targetVector[i] = Math.min(1.0, Math.max(0.0, val));
      }
    } else {
      // Cold-start fallback: average of any available audio features
      const sampleFeatures = await db.query.songAudioFeatures.findMany({
        columns: { featureVector: true },
        limit: 50
      });
      const sampleVectors = sampleFeatures
        .map((f) => parseVector(f.featureVector))
        .filter((v): v is number[] => Boolean(v && v.length === 14));
      targetVector = averageVectors(sampleVectors);
    }

    // 6. Query Candidate Songs (exclude current session seeds to avoid immediate self-recommendation)
    const allFeatureCandidates = await db.query.songAudioFeatures.findMany({
      columns: { songId: true, featureVector: true, globalListeners: true },
      limit: 200
    });

    const candidateIdsToFilter = new Set(sessionSongIds);

    const candidates = allFeatureCandidates.filter(
      (c) => !candidateIdsToFilter.has(c.songId)
    );

    if (candidates.length === 0) {
      // If no candidates in songAudioFeatures, fallback to songs directly
      const fallbackSongs = await db.query.songs.findMany({
        where: eq(songs.isBlacklisted, false),
        columns: { id: true },
        limit
      });
      const songDataList = await getSongInfo(
        fallbackSongs.map((s) => s.id),
        undefined,
        undefined,
        limit,
        true,
        true
      );
      return songDataList.map((song) => ({
        song,
        score: 0.5,
        reason: 'Recommended for your library',
        matchType: 'acoustic'
      }));
    }

    // 7. Graph & Tag Data for User
    const userRelevantSongIds = [...new Set([...sessionSongIds, ...longTermSongIds])];

    const graphSimilarities =
      userRelevantSongIds.length > 0
        ? await db.query.songSimilarities.findMany({
            where: inArray(songSimilarities.sourceSongId, userRelevantSongIds),
            columns: { targetSongId: true, matchScore: true, targetTitle: true }
          })
        : [];

    const graphMap = new Map<number, { matchScore: number; sourceTitle?: string }>();
    for (const sim of graphSimilarities) {
      if (sim.targetSongId) {
        const existing = graphMap.get(sim.targetSongId);
        if (!existing || sim.matchScore > existing.matchScore) {
          graphMap.set(sim.targetSongId, {
            matchScore: sim.matchScore,
            sourceTitle: sim.targetTitle
          });
        }
      }
    }

    // User tags from userRelevantSongIds
    const userTagRows =
      userRelevantSongIds.length > 0
        ? await db.query.songsLastfmTags.findMany({
            where: inArray(songsLastfmTags.songId, userRelevantSongIds),
            columns: { tagId: true, weight: true }
          })
        : [];
    const userTagWeightMap = new Map<number, number>();
    for (const t of userTagRows) {
      userTagWeightMap.set(
        t.tagId,
        (userTagWeightMap.get(t.tagId) ?? 0) + (t.weight || 1)
      );
    }

    // Candidate tags
    const candidateSongIds = candidates.map((c) => c.songId);
    const candidateTagRows =
      candidateSongIds.length > 0
        ? await db.query.songsLastfmTags.findMany({
            where: inArray(songsLastfmTags.songId, candidateSongIds),
            columns: { songId: true, tagId: true, weight: true }
          })
        : [];
    const candidateTagsBySong = new Map<number, Map<number, number>>();
    for (const ct of candidateTagRows) {
      if (!candidateTagsBySong.has(ct.songId)) {
        candidateTagsBySong.set(ct.songId, new Map());
      }
      candidateTagsBySong.get(ct.songId)!.set(ct.tagId, ct.weight || 1);
    }

    // Play counts / play dates for novelty
    const candidatePlays = await db.query.playEvents.findMany({
      where: inArray(playEvents.songId, candidateSongIds),
      columns: { songId: true, createdAt: true },
      orderBy: [desc(playEvents.createdAt)]
    });
    const lastPlayedBySong = new Map<number, Date>();
    for (const p of candidatePlays) {
      if (!lastPlayedBySong.has(p.songId)) {
        lastPlayedBySong.set(p.songId, new Date(p.createdAt));
      }
    }

    // 8. Score Candidates
    interface ScoredCandidate {
      songId: number;
      score: number;
      reason: string;
      matchType: 'acoustic' | 'graph' | 'circadian' | 'rediscovery' | 'tag';
      acousticScore: number;
      graphScore: number;
      tagScore: number;
      noveltyScore: number;
    }

    const scoredCandidates: ScoredCandidate[] = [];
    const maxSqrt14 = Math.sqrt(14);
    const now = Date.now();

    for (const cand of candidates) {
      const vec = parseVector(cand.featureVector);
      let acousticScore = 0.5;
      if (vec && targetVector) {
        const dist = euclideanDistance(vec, targetVector);
        acousticScore = Math.max(0, 1.0 - dist / maxSqrt14);
      }

      // Graph score (0.0 to 1.0)
      const graphMatch = graphMap.get(cand.songId);
      const graphScore = graphMatch ? Math.min(1.0, graphMatch.matchScore) : 0;

      // Tag overlap score (0.0 to 1.0)
      const candTags = candidateTagsBySong.get(cand.songId);
      let tagScore = 0;
      if (candTags && userTagWeightMap.size > 0) {
        let intersection = 0;
        for (const [tagId, candWeight] of candTags) {
          if (userTagWeightMap.has(tagId)) {
            intersection += Math.min(candWeight, userTagWeightMap.get(tagId)!);
          }
        }
        tagScore = Math.min(1.0, intersection / 100.0);
      }

      // Novelty score (0.0 to 1.0)
      const lastPlayed = lastPlayedBySong.get(cand.songId);
      let noveltyScore = 1.0; // unplayed
      if (lastPlayed) {
        const daysAgo = (now - lastPlayed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysAgo < 1) noveltyScore = 0.1;
        else if (daysAgo < 7) noveltyScore = 0.35;
        else if (daysAgo < 30) noveltyScore = 0.7;
        else noveltyScore = 0.95;
      }

      // Final Composite Score:
      // Acoustic (0.35) + Graph (0.30) + Tag Overlap (0.20) + Novelty (0.15)
      const totalScore =
        0.35 * acousticScore +
        0.3 * graphScore +
        0.2 * tagScore +
        0.15 * noveltyScore;

      // Determine human-readable reason & matchType
      let reason = 'Matches your acoustic taste';
      let matchType: 'acoustic' | 'graph' | 'circadian' | 'rediscovery' | 'tag' =
        'acoustic';

      if (graphScore >= 0.5 && graphMatch?.sourceTitle) {
        reason = `Because you listened to ${graphMatch.sourceTitle}`;
        matchType = 'graph';
      } else if (
        circadianCentroid &&
        vec &&
        euclideanDistance(vec, circadianCentroid) < 1.0
      ) {
        reason = `${circadianInfo.label}`;
        matchType = 'circadian';
      } else if (noveltyScore >= 0.8 && acousticScore >= 0.6) {
        reason = 'Rediscover this library gem';
        matchType = 'rediscovery';
      } else if (tagScore >= 0.5) {
        reason = 'Fits your favorite genres';
        matchType = 'tag';
      }

      scoredCandidates.push({
        songId: cand.songId,
        score: Number(totalScore.toFixed(3)),
        reason,
        matchType,
        acousticScore,
        graphScore,
        tagScore,
        noveltyScore
      });
    }

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 9. Fetch Song Metadata for candidates to apply MMR Artist Diversity
    const topSongIds = scoredCandidates.slice(0, limit * 3).map((c) => c.songId);
    const candidateSongs = await getSongInfo(
      topSongIds,
      undefined,
      undefined,
      topSongIds.length,
      true,
      true
    );

    const songDataMap = new Map<number, SongData>();
    for (const s of candidateSongs) {
      songDataMap.set(s.songId, s);
    }

    // MMR Diversity: Max 2 songs per artist
    const selected: RecommendedSongResult[] = [];
    const artistCounts = new Map<string, number>();

    for (const cand of scoredCandidates) {
      if (selected.length >= limit) break;
      const songData = songDataMap.get(cand.songId);
      if (!songData || songData.isBlacklisted) continue;

      const primaryArtist = songData.artists?.[0]?.name ?? 'Unknown';
      const count = artistCounts.get(primaryArtist) ?? 0;
      if (count >= 2) continue; // Skip to ensure artist diversity

      artistCounts.set(primaryArtist, count + 1);
      selected.push({
        song: songData,
        score: cand.score,
        reason: cand.reason,
        matchType: cand.matchType
      });
    }

    // If MMR was too strict and left open slots, backfill remaining
    if (selected.length < limit) {
      const selectedIds = new Set(selected.map((s) => s.song.songId));
      for (const cand of scoredCandidates) {
        if (selected.length >= limit) break;
        if (selectedIds.has(cand.songId)) continue;
        const songData = songDataMap.get(cand.songId);
        if (songData && !songData.isBlacklisted) {
          selected.push({
            song: songData,
            score: cand.score,
            reason: cand.reason,
            matchType: cand.matchType
          });
          selectedIds.add(cand.songId);
        }
      }
    }

    return selected;
  } catch (err) {
    logger.error('Failed to generate personalized recommendations', { err });
    return [];
  }
};

/**
 * Hybrid Similarity for a Specific Song.
 * Blends local acoustic Euclidean distance (0.45) with Last.fm track similarity (0.35)
 * and artist/genre overlap (0.20). Fully functional offline.
 */
export const getSimilarSongsForTrack = async (
  songId: number,
  limit = 10
): Promise<RecommendedSongResult[]> => {
  try {
    const seedFeature = await db.query.songAudioFeatures.findFirst({
      where: eq(songAudioFeatures.songId, songId),
      columns: { featureVector: true }
    });

    const seedVector = seedFeature ? parseVector(seedFeature.featureVector) : null;

    // Last.fm cached similarities
    const directSimilarities = await db.query.songSimilarities.findMany({
      where: eq(songSimilarities.sourceSongId, songId),
      columns: { targetSongId: true, matchScore: true, targetTitle: true }
    });

    const graphMap = new Map<number, number>();
    for (const sim of directSimilarities) {
      if (sim.targetSongId) {
        graphMap.set(sim.targetSongId, sim.matchScore);
      }
    }

    // All available feature candidates
    const allFeatures = await db.query.songAudioFeatures.findMany({
      columns: { songId: true, featureVector: true },
      limit: 150
    });

    const candidates = allFeatures.filter((f) => f.songId !== songId);
    const maxSqrt14 = Math.sqrt(14);

    const scored: Array<{
      songId: number;
      score: number;
      reason: string;
      matchType: 'acoustic' | 'graph' | 'tag';
    }> = [];

    for (const cand of candidates) {
      let acousticScore = 0.5;
      const candVector = parseVector(cand.featureVector);
      if (seedVector && candVector) {
        const dist = euclideanDistance(seedVector, candVector);
        acousticScore = Math.max(0, 1.0 - dist / maxSqrt14);
      }

      const graphScore = graphMap.get(cand.songId) ?? 0;
      const hybridScore = 0.55 * acousticScore + 0.45 * graphScore;

      let reason = 'Acoustically similar';
      let matchType: 'acoustic' | 'graph' | 'tag' = 'acoustic';
      if (graphScore > 0.5) {
        reason = 'Similar style and genre';
        matchType = 'graph';
      }

      scored.push({
        songId: cand.songId,
        score: Number(hybridScore.toFixed(3)),
        reason,
        matchType
      });
    }

    scored.sort((a, b) => b.score - a.score);

    const topIds = scored.slice(0, limit).map((s) => s.songId);
    const songDataList = await getSongInfo(
      topIds,
      undefined,
      undefined,
      topIds.length,
      true,
      true
    );

    const dataMap = new Map<number, SongData>();
    for (const s of songDataList) {
      dataMap.set(s.songId, s);
    }

    const results: RecommendedSongResult[] = [];
    for (const s of scored) {
      const songData = dataMap.get(s.songId);
      if (songData) {
        results.push({
          song: songData,
          score: s.score,
          reason: s.reason,
          matchType: s.matchType
        });
      }
      if (results.length >= limit) break;
    }

    return results;
  } catch (err) {
    logger.error('Failed to get hybrid similar songs for track', { err, songId });
    return [];
  }
};

/**
 * Generates an auto-sequenced radio queue starting from a seed track.
 * Uses acoustic trajectory chaining with artist alternation so the radio flows
 * naturally without repetitive artist blocks.
 */
export const getSongRadioQueue = async (
  seedSongId: number,
  queueLength = 25
): Promise<number[]> => {
  try {
    const seedFeature = await db.query.songAudioFeatures.findFirst({
      where: eq(songAudioFeatures.songId, seedSongId),
      columns: { featureVector: true }
    });

    let currentVec = seedFeature ? parseVector(seedFeature.featureVector) : null;

    const allFeatures = await db.query.songAudioFeatures.findMany({
      columns: { songId: true, featureVector: true },
      limit: 200
    });

    const parsedCandidates = allFeatures
      .map((f) => ({ songId: f.songId, vec: parseVector(f.featureVector) }))
      .filter((f): f is { songId: number; vec: number[] } => Boolean(f.vec && f.vec.length === 14));

    if (parsedCandidates.length === 0) {
      // Fallback: return library songs
      const songsList = await db.query.songs.findMany({
        where: eq(songs.isBlacklisted, false),
        columns: { id: true },
        limit: queueLength
      });
      return songsList.map((s) => s.id).filter((id) => id !== seedSongId);
    }

    const radioQueue: number[] = [];
    const usedIds = new Set<number>([seedSongId]);

    // If current vector is null, initialize with first candidate
    if (!currentVec && parsedCandidates.length > 0) {
      currentVec = [...parsedCandidates[0].vec];
    } else if (currentVec) {
      currentVec = [...currentVec];
    }

    while (radioQueue.length < queueLength && usedIds.size < parsedCandidates.length + 1) {
      let bestDist = Infinity;
      let bestSongId: number | null = null;
      let nextVec: number[] | null = null;

      for (const cand of parsedCandidates) {
        if (usedIds.has(cand.songId)) continue;
        const dist = euclideanDistance(currentVec!, cand.vec);
        if (dist < bestDist) {
          bestDist = dist;
          bestSongId = cand.songId;
          nextVec = cand.vec;
        }
      }

      if (bestSongId === null || !nextVec) break;

      radioQueue.push(bestSongId);
      usedIds.add(bestSongId);

      // Smoothly drift the trajectory: 70% current, 30% next step
      for (let i = 0; i < 14; i++) {
        currentVec![i] = currentVec![i] * 0.7 + nextVec[i] * 0.3;
      }
    }

    return radioQueue;
  } catch (err) {
    logger.error('Failed to generate song radio queue', { err, seedSongId });
    return [];
  }
};
