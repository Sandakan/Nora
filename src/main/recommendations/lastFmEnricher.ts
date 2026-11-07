import { db } from '@main/db/db';
import {
  albums,
  albumsLastfmTags,
  artists,
  artistsLastfmTags,
  lastfmTags,
  songAudioFeatures,
  songs,
  songsLastfmTags,
  songSimilarities
} from '@main/db/schema';
import logger from '@main/logger';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * Upserts a Last.fm tag into the lastfm_tags table by case-insensitive name.
 */
export const upsertLastFmTag = async (
  tagName: string,
  url?: string,
  trx: DB | DBTransaction = db
): Promise<number | null> => {
  const cleanName = tagName.trim();
  if (!cleanName) return null;

  try {
    const existing = await trx.query.lastfmTags.findFirst({
      where: eq(lastfmTags.nameCI, cleanName)
    });

    if (existing) {
      return existing.id;
    }

    const inserted = await trx
      .insert(lastfmTags)
      .values({
        name: cleanName,
        url: url || null
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length > 0) {
      return inserted[0].id;
    }

    // In case of concurrent insert race condition:
    const fallback = await trx.query.lastfmTags.findFirst({
      where: eq(lastfmTags.nameCI, cleanName)
    });
    return fallback?.id ?? null;
  } catch (err) {
    logger.warn('Failed to upsert Last.fm tag', { tagName, error: String(err) });
    return null;
  }
};

/**
 * Links Last.fm tags to a song with weights.
 */
export const saveSongLastFmTags = async (
  songId: number,
  tags: Array<{ name: string; url?: string; count?: number }>,
  trx: DB | DBTransaction = db
) => {
  for (const tag of tags) {
    const tagId = await upsertLastFmTag(tag.name, tag.url, trx);
    if (!tagId) continue;

    const weight = tag.count ?? 100;
    await trx
      .insert(songsLastfmTags)
      .values({ songId, tagId, weight })
      .onConflictDoUpdate({
        target: [songsLastfmTags.songId, songsLastfmTags.tagId],
        set: { weight }
      })
      .catch(() => {});
  }
};

/**
 * Links Last.fm tags to an artist with weights.
 */
export const saveArtistLastFmTags = async (
  artistId: number,
  tags: Array<{ name: string; url?: string; count?: number }>,
  trx: DB | DBTransaction = db
) => {
  for (const tag of tags) {
    const tagId = await upsertLastFmTag(tag.name, tag.url, trx);
    if (!tagId) continue;

    const weight = tag.count ?? 100;
    await trx
      .insert(artistsLastfmTags)
      .values({ artistId, tagId, weight })
      .onConflictDoUpdate({
        target: [artistsLastfmTags.artistId, artistsLastfmTags.tagId],
        set: { weight }
      })
      .catch(() => {});
  }
};

/**
 * Links Last.fm tags to an album with weights.
 */
export const saveAlbumLastFmTags = async (
  albumId: number,
  tags: Array<{ name: string; url?: string; count?: number }>,
  trx: DB | DBTransaction = db
) => {
  for (const tag of tags) {
    const tagId = await upsertLastFmTag(tag.name, tag.url, trx);
    if (!tagId) continue;

    const weight = tag.count ?? 100;
    await trx
      .insert(albumsLastfmTags)
      .values({ albumId, tagId, weight })
      .onConflictDoUpdate({
        target: [albumsLastfmTags.albumId, albumsLastfmTags.tagId],
        set: { weight }
      })
      .catch(() => {});
  }
};

/**
 * Harvests track.getInfo payload to backfill MBIDs, global popularity, and tags.
 */
export const harvestTrackInfo = async (
  songId: number,
  trackData: {
    mbid?: string;
    listeners?: string | number;
    playcount?: string | number;
    artist?: { name: string; mbid?: string };
    album?: { title: string; mbid?: string };
    toptags?: { tag?: Array<{ name: string; url?: string }> | { name: string; url?: string } };
  },
  trx: DB | DBTransaction = db
) => {
  try {
    // 1. Backfill song MBID if present
    if (trackData.mbid && trackData.mbid.trim()) {
      await trx
        .update(songs)
        .set({ mbid: trackData.mbid.trim() })
        .where(and(eq(songs.id, songId), isNull(songs.mbid)));
    }

    // 2. Backfill artist MBID
    if (trackData.artist?.mbid && trackData.artist.mbid.trim()) {
      const songRow = await trx.query.songs.findFirst({
        where: eq(songs.id, songId),
        with: {
          artists: {
            with: { artist: true }
          }
        }
      });
      const primaryArtist = songRow?.artists?.[0]?.artist;
      if (primaryArtist && !primaryArtist.mbid) {
        await trx
          .update(artists)
          .set({ mbid: trackData.artist.mbid.trim() })
          .where(eq(artists.id, primaryArtist.id));
      }
    }

    // 3. Backfill album MBID
    if (trackData.album?.mbid && trackData.album.mbid.trim()) {
      const songRow = await trx.query.songs.findFirst({
        where: eq(songs.id, songId),
        with: {
          albums: {
            with: { album: true }
          }
        }
      });
      const albumObj = songRow?.albums?.[0]?.album;
      if (albumObj && !albumObj.mbid) {
        await trx
          .update(albums)
          .set({ mbid: trackData.album.mbid.trim() })
          .where(eq(albums.id, albumObj.id));
      }
    }

    // 4. Update global listeners / playcount on song_audio_features
    const listeners = trackData.listeners ? Number(trackData.listeners) : undefined;
    const playcount = trackData.playcount ? Number(trackData.playcount) : undefined;

    await trx
      .insert(songAudioFeatures)
      .values({
        songId,
        globalListeners: listeners,
        globalPlaycount: playcount,
        lastfmSyncedAt: new Date()
      })
      .onConflictDoUpdate({
        target: songAudioFeatures.songId,
        set: {
          globalListeners: listeners ?? songAudioFeatures.globalListeners,
          globalPlaycount: playcount ?? songAudioFeatures.globalPlaycount,
          lastfmSyncedAt: new Date(),
          updatedAt: new Date()
        }
      });

    // 5. Store tags
    const rawTags = trackData.toptags?.tag;
    const tagsList = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : [];
    if (tagsList.length > 0) {
      await saveSongLastFmTags(songId, tagsList, trx);
    }
  } catch (err) {
    logger.warn('Failed to harvest track info from LastFM', { songId, error: String(err) });
  }
};

/**
 * Harvests track.getSimilar results into song_similarities with deferred FK matching.
 */
export const harvestSimilarTracks = async (
  sourceSongId: number,
  similarTracks: Array<{
    name: string;
    mbid?: string;
    match: string | number;
    url?: string;
    artist?: { name: string; mbid?: string };
  }>,
  trx: DB | DBTransaction = db
) => {
  for (const item of similarTracks) {
    const targetTitle = item.name.trim();
    const targetArtist = item.artist?.name?.trim() || '';
    const targetMbid = item.mbid?.trim() || null;
    const matchScore = typeof item.match === 'string' ? parseFloat(item.match) : item.match;

    // Check if target matches an existing local song
    let matchedSongId: number | null = null;
    if (targetMbid) {
      const s = await trx.query.songs.findFirst({
        where: eq(songs.mbid, targetMbid),
        columns: { id: true }
      });
      if (s) matchedSongId = s.id;
    }

    if (!matchedSongId && targetTitle && targetArtist) {
      const candidates = await trx.query.songs.findMany({
        where: eq(songs.titleCI, targetTitle),
        columns: { id: true, mbid: true },
        with: {
          artists: {
            with: { artist: true }
          }
        }
      });
      const matchingSong = candidates.find((c) =>
        c.artists?.some(
          (a) => a.artist?.name.toLowerCase() === targetArtist.toLowerCase()
        )
      );
      if (matchingSong) {
        matchedSongId = matchingSong.id;
        if (!matchingSong.mbid && targetMbid) {
          await trx.update(songs).set({ mbid: targetMbid }).where(eq(songs.id, matchingSong.id));
        }
      }
    }

    // Insert or update similarity edge
    await trx
      .insert(songSimilarities)
      .values({
        sourceSongId,
        targetSongId: matchedSongId,
        targetTitle,
        targetArtist,
        targetMbid,
        targetUrl: item.url || null,
        matchScore: isNaN(matchScore) ? 0.5 : matchScore
      })
      .onConflictDoNothing();
  }
};

/**
 * Opportunistically triggers Last.fm enrichment when a song is played or favorited.
 * Rate-limited to at most once per 14 days per song.
 */
export const enrichSongOnPlayOrFavorite = async (songId: number) => {
  try {
    const existing = await db.query.songAudioFeatures.findFirst({
      where: eq(songAudioFeatures.songId, songId),
      columns: { lastfmSyncedAt: true }
    });

    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
    if (existing?.lastfmSyncedAt) {
      const age = Date.now() - new Date(existing.lastfmSyncedAt).getTime();
      if (age < FOURTEEN_DAYS_MS) {
        return; // Recently synced, skip API calls
      }
    }

    const songRow = await db.query.songs.findFirst({
      where: eq(songs.id, songId),
      columns: { id: true, title: true, mbid: true },
      with: {
        artists: {
          with: { artist: true }
        }
      }
    });

    if (!songRow) return;

    const artistNames = songRow.artists?.map((a) => a.artist.name) ?? [];
    if (artistNames.length === 0) return;

    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) return;

    // 1. Fetch track info with MBID first, fallback to title + artist
    let trackInfoPayload: Parameters<typeof harvestTrackInfo>[1] | null = null;
    if (songRow.mbid) {
      try {
        const url = new URL('https://ws.audioscrobbler.com/2.0/');
        url.searchParams.set('method', 'track.getInfo');
        url.searchParams.set('format', 'json');
        url.searchParams.set('autocorrect', '1');
        url.searchParams.set('api_key', LAST_FM_API_KEY);
        url.searchParams.set('mbid', songRow.mbid);
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && !json.error && json.track) {
            trackInfoPayload = json.track;
          }
        }
      } catch {
        // Fallback to track + artist name
      }
    }

    if (!trackInfoPayload) {
      try {
        const url = new URL('https://ws.audioscrobbler.com/2.0/');
        url.searchParams.set('method', 'track.getInfo');
        url.searchParams.set('format', 'json');
        url.searchParams.set('autocorrect', '1');
        url.searchParams.set('api_key', LAST_FM_API_KEY);
        url.searchParams.set('track', songRow.title);
        url.searchParams.set('artist', artistNames[0]);
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && !json.error && json.track) {
            trackInfoPayload = json.track;
          }
        }
      } catch {
        // Track lookup failed
      }
    }

    if (trackInfoPayload) {
      await harvestTrackInfo(songId, trackInfoPayload);
    }

    // 2. Fetch similar tracks
    try {
      const url = new URL('https://ws.audioscrobbler.com/2.0/');
      url.searchParams.set('method', 'track.getSimilar');
      url.searchParams.set('format', 'json');
      url.searchParams.set('autocorrect', '1');
      url.searchParams.set('api_key', LAST_FM_API_KEY);
      url.searchParams.set('limit', '15');
      if (songRow.mbid) {
        url.searchParams.set('mbid', songRow.mbid);
      } else {
        url.searchParams.set('track', songRow.title);
        url.searchParams.set('artist', artistNames[0]);
      }

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const rawTracks = json?.similartracks?.track;
        const tracksList = Array.isArray(rawTracks) ? rawTracks : rawTracks ? [rawTracks] : [];
        if (tracksList.length > 0) {
          await harvestSimilarTracks(songId, tracksList);
        }
      }
    } catch {
      // Similar tracks lookup failed
    }
  } catch (err) {
    logger.warn('Failed in enrichSongOnPlayOrFavorite', { songId, error: String(err) });
  }
};
