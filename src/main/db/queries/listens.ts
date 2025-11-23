import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { playEvents, seekEvents, skipEvents } from '../schema';

export type GetAllSongListeningDataReturnType = Awaited<ReturnType<typeof getAllSongListeningData>>;
export const getAllSongListeningData = async (songIds?: number[], trx: DB | DBTransaction = db) => {
  const data = await trx.query.songs.findMany({
    where: (songs) => {
      if (Array.isArray(songIds) && songIds.length > 0) {
        return inArray(songs.id, songIds);
      }

      return undefined;
    },
    columns: {
      id: true
    },
    extras: {
      songId: sql<number>`id`.as('songId')
    },
    with: {
      playEvents: {
        columns: { songId: false },
        orderBy: (playEvents, { desc }) => [desc(playEvents.createdAt)]
      },
      seekEvents: {
        columns: { songId: false },
        orderBy: (seekEvents, { desc }) => [desc(seekEvents.createdAt)]
      },
      skipEvents: {
        columns: { songId: false },
        orderBy: (skipEvents, { desc }) => [desc(skipEvents.createdAt)]
      }
    }
  });

  return data;
};

export const addSongPlayEvent = (
  songId: number,
  playbackPercentage: string,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(playEvents).values({ playbackPercentage, songId });
};

export const addSongSeekEvent = (
  songId: number,
  position: string,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(seekEvents).values({ position, songId });
};

export const addSongSkipEvent = (
  songId: number,
  position: string,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(skipEvents).values({ position, songId });
};

export const deleteSongPlayEvents = (songId: number, trx: DB | DBTransaction = db) => {
  return trx.delete(playEvents).where(eq(playEvents.songId, songId));
};

export const deleteSongSeekEvents = (songId: number, trx: DB | DBTransaction = db) => {
  return trx.delete(seekEvents).where(eq(seekEvents.songId, songId));
};

export const deleteSongSkipEvents = (songId: number, trx: DB | DBTransaction = db) => {
  return trx.delete(skipEvents).where(eq(skipEvents.songId, songId));
};
