import { getAllSongsInHistory } from '@main/db/queries/history';
import { convertToSongData } from '../utils/convert';

export const getAllHistorySongs = async (
  sortType?: SongSortTypes,
  paginatingData?: PaginatingData
): Promise<PaginatedResult<SongData, SongSortTypes>> => {
  const data = await getAllSongsInHistory(sortType, paginatingData);
  const songs = data.data.map((song) => convertToSongData(song));

  return {
    data: songs,
    sortType: sortType || 'addedOrder',
    end: paginatingData?.end || 0,
    start: paginatingData?.start || 0,
    total: songs.length
  };
};
