import { getAllSongListeningData } from '@main/db/queries/listens';

export const getListeningData = async (songIds: number[]) => {
  if (songIds.length === 0) return [];

  const listeningData = await getAllSongListeningData(
    songIds.map((id) => Number(id)).filter((id) => !isNaN(id))
  );
  return listeningData;
};
