import { db } from '../db';
import { playEvents, seekEvents, skipEvents } from '../schema';

export const getSongListeningData = (songId: number, trx: DB | DBTransaction = db) => {
  return trx.query.songs.findFirst({
    where: (songs, { eq }) => eq(songs.id, songId),
    columns: {
      id: true
    },
    with: {
      playEvents: { orderBy: (playEvents, { desc }) => [desc(playEvents.createdAt)] },
      seekEvents: { orderBy: (seekEvents, { desc }) => [desc(seekEvents.createdAt)] },
      skipEvents: { orderBy: (skipEvents, { desc }) => [desc(skipEvents.createdAt)] }
    }
  });
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
  positions: string[],
  trx: DB | DBTransaction = db
) => {
  return trx.insert(seekEvents).values(positions.map((position) => ({ position, songId })));
};

export const addSongSkipEvent = (
  songId: number,
  position: string,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(skipEvents).values({ position, songId });
};
