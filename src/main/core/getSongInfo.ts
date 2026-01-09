import logger from '../logger';
import { getAllSongs } from '@main/db/queries/songs';
import { convertToSongData } from '../utils/convert';

const getSongInfo = async (
  songIds: number[],
  sortType?: SongSortTypes,
  filterType?: SongFilterTypes,
  limit = songIds.length,
  preserveIdOrder = false,
  noBlacklistedSongs = false
): Promise<SongData[]> => {
  logger.debug(`Fetching song data from getSongInfo`, {
    songIdsLength: songIds.length,
    sortType,
    limit,
    preserveIdOrder,
    noBlacklistedSongs
  });
  if (songIds.length > 0) {
    const songsDataResponse = await getAllSongs({
      sortType,
      filterType,
      songIds: songIds.map((id) => Number(id)),
      preserveIdOrder
    });

    const songsData = songsDataResponse.data;

    if (Array.isArray(songsData) && songsData.length > 0) {
      let updatedResults: SongData[] = songsData.map((x) => convertToSongData(x));

      if (noBlacklistedSongs)
        updatedResults = updatedResults.filter((result) => !result.isBlacklisted);

      return updatedResults;
    }
    logger.error(`Failed to get songs info from get-song-info function. songs data are empty.`);
    return [];
  }
  logger.warn(`App made a request to get-song-info function with an empty array of song ids.`);
  return [];
};

export default getSongInfo;
