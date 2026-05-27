import { db } from '@db/db';
import { eq, sql, type SQL } from 'drizzle-orm';

import { songs, playlistsSongs } from '../schema';

function buildCondition(rule: SmartPlaylistRule): SQL | undefined {
  const { field, operator, value } = rule;

  const numeric = (col: SQL) => {
    const n = Number(value);
    switch (operator) {
      case 'eq': return sql`${col} = ${n}`;
      case 'neq': return sql`${col} != ${n}`;
      case 'gt': return sql`${col} > ${n}`;
      case 'gte': return sql`${col} >= ${n}`;
      case 'lt': return sql`${col} < ${n}`;
      case 'lte': return sql`${col} <= ${n}`;
      default: return undefined;
    }
  };

  const str = (col: SQL) => {
    const s = String(value);
    switch (operator) {
      case 'eq': return sql`${col} = ${s}`;
      case 'neq': return sql`${col} != ${s}`;
      case 'contains': return sql`${col} ILIKE ${`%${s}%`}`;
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
      return numeric(sql`songs.year`);

    case 'duration':
      return numeric(sql`songs.duration`);

    case 'bitRate':
      return numeric(sql`songs.bit_rate`);

    case 'isFavorite':
      return bool(sql`songs.is_favorite`);

    case 'isBlacklisted':
      return bool(sql`songs.is_blacklisted`);

    case 'genre': {
      const cond = str(sql`genres.name`);
      if (!cond) return undefined;
      return sql`exists (select 1 from genres_songs inner join genres on genres_songs.genre_id = genres.id where genres_songs.song_id = songs.id and ${cond})`;
    }

    case 'artist': {
      const cond = str(sql`artists.name`);
      if (!cond) return undefined;
      return sql`exists (select 1 from artists_songs inner join artists on artists_songs.artist_id = artists.id where artists_songs.song_id = songs.id and ${cond})`;
    }

    case 'album': {
      const cond = str(sql`albums.title`);
      if (!cond) return undefined;
      return sql`exists (select 1 from album_songs inner join albums on album_songs.album_id = albums.id where album_songs.song_id = songs.id and ${cond})`;
    }

    case 'playCount': {
      const n = Number(value);
      switch (operator) {
        case 'gt': return sql`(select count(*) from play_events where play_events.song_id = songs.id) > ${n}`;
        case 'gte': return sql`(select count(*) from play_events where play_events.song_id = songs.id) >= ${n}`;
        case 'eq': return sql`(select count(*) from play_events where play_events.song_id = songs.id) = ${n}`;
        case 'lt': return sql`(select count(*) from play_events where play_events.song_id = songs.id) < ${n}`;
        case 'lte': return sql`(select count(*) from play_events where play_events.song_id = songs.id) <= ${n}`;
        default: return undefined;
      }
    }

    case 'skipCount': {
      const n = Number(value);
      switch (operator) {
        case 'gt': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) > ${n}`;
        case 'gte': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) >= ${n}`;
        case 'eq': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) = ${n}`;
        case 'lt': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) < ${n}`;
        case 'lte': return sql`(select count(*) from skip_events where skip_events.song_id = songs.id) <= ${n}`;
        default: return undefined;
      }
    }

    case 'lastPlayed': {
      const daysAgo = Number(value);
      const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const lastPlayed = sql`(select max(play_history.created_at) from play_history where play_history.song_id = songs.id)`;
      switch (operator) {
        case 'gt': return sql`${lastPlayed} > ${cutoff}::timestamp`;
        case 'gte': return sql`${lastPlayed} >= ${cutoff}::timestamp`;
        case 'eq': return sql`${lastPlayed} between ${cutoff}::timestamp and ${new Date(cutoff.getTime() + 86400000)}::timestamp`;
        case 'lt': return sql`${lastPlayed} < ${cutoff}::timestamp`;
        case 'lte': return sql`${lastPlayed} <= ${cutoff}::timestamp`;
        default: return undefined;
      }
    }

    default:
      return undefined;
  }
}

export const evaluateSmartPlaylist = async (
  criteria: SmartPlaylistCriteria
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
    query = sql`select ${songs.id} from songs`;
  }

  if (criteria.limit && criteria.limit > 0) {
    query = sql`${query} order by songs.created_at desc limit ${criteria.limit}`;
  } else {
    query = sql`${query} order by songs.created_at desc`;
  }

  const result = await db.execute<{ id: number }>(query);
  return result.rows?.map((r) => r.id) ?? [];
};

export const refreshSmartPlaylist = async (
  playlistId: number,
  criteria: SmartPlaylistCriteria
): Promise<number[]> => {
  const songIds = await evaluateSmartPlaylist(criteria);

  await db.transaction(async (trx) => {
    await trx.delete(playlistsSongs).where(eq(playlistsSongs.playlistId, playlistId));

    if (songIds.length > 0) {
      await trx.insert(playlistsSongs).values(
        songIds.map((songId, idx) => ({
          playlistId,
          songId,
          createdAt: new Date(Date.now() + idx),
          updatedAt: new Date(Date.now() + idx)
        }))
      );
    }
  });

  return songIds;
};
