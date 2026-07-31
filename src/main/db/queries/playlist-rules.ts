import { db } from '@db/db';
import { eq, sql, type SQL } from 'drizzle-orm';

import { songs, playlistsSongs } from '../schema';

function buildCondition(rule: SmartPlaylistRule): SQL | undefined {
  const { field, operator, value } = rule;

  // year/bitRate are nullable in the schema. For `neq`, unknown values must
  // match ("not 2000" includes songs with no year) — bare `col != n` drops
  // them because `NULL != n` is NULL, not true.
  const numeric = (col: SQL, isNullable = false) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    const neq = isNullable ? sql`${col} IS NULL OR ${col} != ${n}` : sql`${col} != ${n}`;
    switch (operator) {
      case 'eq': return sql`${col} = ${n}`;
      case 'neq': return neq;
      case 'gt': return sql`${col} > ${n}`;
      case 'gte': return sql`${col} >= ${n}`;
      case 'lt': return sql`${col} < ${n}`;
      case 'lte': return sql`${col} <= ${n}`;
      default: return undefined;
    }
  };

  const escapeLike = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

  const str = (col: SQL) => {
    const s = String(value);
    switch (operator) {
      // ILIKE for eq/neq matches the case-insensitive behavior of contains and
      // the citext columns elsewhere. Escape wildcards so `eq` is exact-ish.
      case 'eq': return sql`${col} ILIKE ${escapeLike(s)} ESCAPE '\\'`;
      case 'neq': return sql`${col} NOT ILIKE ${escapeLike(s)} ESCAPE '\\'`;
      case 'contains': {
        return sql`${col} ILIKE ${`%${escapeLike(s)}%`} ESCAPE '\\'`;
      }
      default: return undefined;
    }
  };

  const bool = (col: SQL) => {
    const b = value === true || value === 'true';
    switch (operator) {
      case 'eq': return sql`${col} = ${b}`;
      case 'neq': return sql`${col} != ${b}`;
      default: return undefined;
    }
  };

  switch (field) {
    case 'year':
      return numeric(sql`songs.year`, true);

    case 'duration':
      return numeric(sql`songs.duration`);

    case 'bitRate':
      return numeric(sql`songs.bit_rate`, true);

    case 'isFavorite':
      return bool(sql`songs.is_favorite`);

    case 'isBlacklisted':
      return bool(sql`songs.is_blacklisted`);

    case 'genre': {
      const cond = str(sql`genres.name`);
      if (!cond) return undefined;
      if (operator === 'neq') {
        // "genre is not X" must include songs with no genre rows at all,
        // not just songs whose genres differ from X.
        return sql`not exists (select 1 from genres_songs inner join genres on genres_songs.genre_id = genres.id where genres_songs.song_id = songs.id and ${cond})`;
      }
      return sql`exists (select 1 from genres_songs inner join genres on genres_songs.genre_id = genres.id where genres_songs.song_id = songs.id and ${cond})`;
    }

    case 'artist': {
      const cond = str(sql`artists.name`);
      if (!cond) return undefined;
      if (operator === 'neq') {
        return sql`not exists (select 1 from artists_songs inner join artists on artists_songs.artist_id = artists.id where artists_songs.song_id = songs.id and ${cond})`;
      }
      return sql`exists (select 1 from artists_songs inner join artists on artists_songs.artist_id = artists.id where artists_songs.song_id = songs.id and ${cond})`;
    }

    case 'album': {
      const cond = str(sql`albums.title`);
      if (!cond) return undefined;
      if (operator === 'neq') {
        return sql`not exists (select 1 from album_songs inner join albums on album_songs.album_id = albums.id where album_songs.song_id = songs.id and ${cond})`;
      }
      return sql`exists (select 1 from album_songs inner join albums on album_songs.album_id = albums.id where album_songs.song_id = songs.id and ${cond})`;
    }

    case 'playCount': {
      const n = Number(value);
      if (!Number.isFinite(n)) return undefined;
      switch (operator) {
        case 'gt': return sql`(select count(*) from play_events where play_events.song_id = songs.id) > ${n}`;
        case 'gte': return sql`(select count(*) from play_events where play_events.song_id = songs.id) >= ${n}`;
        case 'eq': return sql`(select count(*) from play_events where play_events.song_id = songs.id) = ${n}`;
        case 'neq': return sql`(select count(*) from play_events where play_events.song_id = songs.id) != ${n}`;
        case 'lt': return sql`(select count(*) from play_events where play_events.song_id = songs.id) < ${n}`;
        case 'lte': return sql`(select count(*) from play_events where play_events.song_id = songs.id) <= ${n}`;
        default: return undefined;
      }
    }

    case 'skipCount': {
      const n = Number(value);
      if (!Number.isFinite(n)) return undefined;
      switch (operator) {
        case 'gt': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) > ${n}`;
        case 'gte': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) >= ${n}`;
        case 'eq': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) = ${n}`;
        case 'neq': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) != ${n}`;
        case 'lt': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) < ${n}`;
        case 'lte': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) <= ${n}`;
        default: return undefined;
      }
    }

    case 'lastPlayed': {
      const daysAgo = Number(value);
      if (!Number.isFinite(daysAgo)) return undefined;
      const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const lastPlayed = sql`(select max(play_history.created_at) from play_history where play_history.song_id = songs.id)`;
      switch (operator) {
        // "greater than N days ago" = played before the cutoff. Never-played
        // songs (NULL) count as "played long ago" so they must be included.
        case 'gt': return sql`${lastPlayed} IS NULL OR ${lastPlayed} < ${cutoff}::timestamp`;
        case 'gte': return sql`${lastPlayed} IS NULL OR ${lastPlayed} <= ${cutoff}::timestamp`;
        case 'eq': return sql`${lastPlayed} between ${cutoff}::timestamp and ${new Date(cutoff.getTime() + 86400000)}::timestamp`;
        // "less than N days ago" = played after the cutoff (within the window).
        case 'lt': return sql`${lastPlayed} > ${cutoff}::timestamp`;
        case 'lte': return sql`${lastPlayed} >= ${cutoff}::timestamp`;
        case 'neq': return sql`${lastPlayed} IS NULL OR ${lastPlayed} not between ${cutoff}::timestamp and ${new Date(cutoff.getTime() + 86400000)}::timestamp`;
        default: return undefined;
      }
    }

    default:
      return undefined;
  }
}

export const evaluateSmartPlaylist = async (
  criteria: SmartPlaylistCriteria,
  trx: DB | DBTransaction = db
): Promise<number[]> => {
  const conditions: SQL[] = [];

  for (const rule of criteria.rules) {
    const cond = buildCondition(rule);
    if (cond) conditions.push(cond);
  }

  let query: SQL;

  if (conditions.length > 0) {
    const joiner = criteria.matchType === 'ALL' ? sql` and ` : sql` or `;
    const whereClause = conditions.reduce((a, b) => sql`${a}${joiner}${b}`);
    query = sql`select ${songs.id} from songs where ${whereClause}`;
  } else {
    query = sql`select ${songs.id} from songs where 1 = 0`;
  }

  if (criteria.limit && criteria.limit > 0) {
    query = sql`${query} order by songs.created_at desc limit ${criteria.limit}`;
  } else {
    query = sql`${query} order by songs.created_at desc`;
  }

  const result = await trx.execute<{ id: number }>(query);
  return result.rows?.map((r) => r.id) ?? [];
};

export const refreshSmartPlaylist = async (
  playlistId: number,
  criteria: SmartPlaylistCriteria,
  trx?: DBTransaction
): Promise<number[]> => {
  const run = async (t: DBTransaction) => {
    const songIds = await evaluateSmartPlaylist(criteria, t);

    await t.delete(playlistsSongs).where(eq(playlistsSongs.playlistId, playlistId));

    if (songIds.length > 0) {
      await t.insert(playlistsSongs).values(
        songIds.map((songId, idx) => ({
          playlistId,
          songId,
          createdAt: new Date(Date.now() + idx),
          updatedAt: new Date(Date.now() + idx)
        }))
      );
    }

    return songIds;
  };

  if (trx) {
    return run(trx);
  }
  return db.transaction(run);
};
