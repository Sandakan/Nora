import { convertToSongData } from '../utils/convert';
import { getAllSongsInFavorite } from '@main/db/queries/songs';

export const getAllFavoriteSongs = async (
  sortType?: SongSortTypes,
  paginatingData?: PaginatingData
): Promise<PaginatedResult<SongData, SongSortTypes>> => {
  const data = await getAllSongsInFavorite(sortType, paginatingData);
  const songs = data.data.map((song) => convertToSongData(song));

  return {
    data: songs,
    sortType: sortType || 'addedOrder',
    end: paginatingData?.end || 0,
    start: paginatingData?.start || 0,
    total: songs.length
  };
};
