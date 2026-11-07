import { eq } from 'drizzle-orm';
import type { LastFmArtistInfoAPI } from '../../../types/last_fm_artist_info_api';
import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';

const LAST_FM_BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

const getArtistInfoFromLastFM = async (artistName: string, mbid?: string) => {
  const isConnectedToInternet = checkIfConnectedToInternet();
  if (isConnectedToInternet) {
    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;

    try {
      if (typeof LAST_FM_API_KEY !== 'string') {
        logger.error('LAST_FM_API_KEY not found.', { LAST_FM_API_KEY });
        throw new Error('LAST_FM_API_KEY not found');
      }

      const makeUrl = (useMbid: boolean) => {
        const url = new URL(LAST_FM_BASE_URL);
        url.searchParams.set('method', 'artist.getinfo');
        url.searchParams.set('format', 'json');
        url.searchParams.set('autocorrect', '1');
        url.searchParams.set('api_key', LAST_FM_API_KEY);
        if (useMbid && mbid) {
          url.searchParams.set('mbid', mbid.trim());
        } else {
          url.searchParams.set('artist', artistName.trim());
        }
        return url;
      };

      let res = mbid ? await fetch(makeUrl(true)) : null;
      let data = res && res.ok ? ((await res.json()) as LastFmArtistInfoAPI) : null;

      if (!data || ('error' in data && data.error === 6)) {
        res = await fetch(makeUrl(false));
        if (res.ok) {
          data = (await res.json()) as LastFmArtistInfoAPI;
        }
      }

      if (data) {
        if ('error' in data) {
          logger.error(`Artist info not found in the internet.`, {
            artistName,
            error: data.error,
            message: data.message
          });
          throw new Error(`Artist info not found in the internet.`);
        }

        // Opportunistic harvesting of artist MBID, similarities and tags
        const artistObj = data.artist;
        if (artistObj) {
          import('@main/db/db').then(async ({ db }) => {
            const { artists, artistSimilarities } = await import('@main/db/schema');
            const { saveArtistLastFmTags } = await import('../../recommendations/lastFmEnricher');
            const localArtist = await db.query.artists.findFirst({
              where: (a, { eq }) => eq(a.nameCI, artistName.trim())
            });

            if (localArtist) {
              if (!localArtist.mbid && artistObj.mbid) {
                await db
                  .update(artists)
                  .set({ mbid: artistObj.mbid.trim() })
                  .where(eq(artists.id, localArtist.id));
              }

              const rawTags = artistObj.tags?.tag;
              const tagsList = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : [];
              if (tagsList.length > 0) {
                await saveArtistLastFmTags(localArtist.id, tagsList, db);
              }

              const rawSim = artistObj.similar?.artist;
              const simList = Array.isArray(rawSim) ? rawSim : rawSim ? [rawSim] : [];
              for (const sim of simList) {
                const targetMbid = sim.mbid?.trim() || null;
                const targetName = sim.name.trim();
                let matchedId: number | null = null;
                if (targetMbid) {
                  const s = await db.query.artists.findFirst({
                    where: eq(artists.mbid, targetMbid),
                    columns: { id: true }
                  });
                  if (s) matchedId = s.id;
                }
                if (!matchedId) {
                  const s = await db.query.artists.findFirst({
                    where: eq(artists.nameCI, targetName),
                    columns: { id: true }
                  });
                  if (s) matchedId = s.id;
                }

                await db
                  .insert(artistSimilarities)
                  .values({
                    sourceArtistId: localArtist.id,
                    targetArtistId: matchedId,
                    targetArtistName: targetName,
                    targetMbid,
                    targetUrl: sim.url || null,
                    matchScore: 0.8
                  })
                  .onConflictDoNothing();
              }
            }
          }).catch(() => {});
        }

        return data;
      }

      const errStr = `Failed to fetch artist data from LastFM`;
      logger.warn(errStr, { artistName, status: res?.status, statusText: res?.statusText });
      throw new Error(errStr);
    } catch (error) {
      logger.error(`Failed to parse fetched artist data from LastFM.`, { error });
      throw new Error(`An error occurred when parsing fetched data. error : ${error}`);
    }
  } else {
    logger.info(
      `Failed to fetch from deezer api about artist information. App is not connected to the internet.`,
      { isConnectedToInternet }
    );
    throw new Error('NO_NETWORK_CONNECTION' as MessageCodes);
  }
};

export default getArtistInfoFromLastFM;
