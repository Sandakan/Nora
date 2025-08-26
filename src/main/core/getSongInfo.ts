import { isSongBlacklisted } from '../utils/isBlacklisted';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import logger from '../logger';
import { getSelectedPaletteData } from '../other/generatePalette';
import { getAllSongs } from '@main/db/queries/songs';

const getSongInfo = async (
  songIds: string[],
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
    const songsData = await getAllSongs({
      sortType,
      filterType,
      songIds: songIds.map((id) => Number(id))
    });

    if (Array.isArray(songsData) && songsData.length > 0) {
      const results: SavableSongData[] = [];

      if (preserveIdOrder)
        for (let x = 0; x < songIds.length; x += 1) {
          for (let y = 0; y < songsData.length; y += 1) {
            if (songIds[x] === songsData[y].songId) {
              results.push(songsData[y]);
            }
          }
        }
      else
        for (let x = 0; x < songsData.length; x += 1) {
          if (songIds.includes(songsData[x].songId)) {
            results.push(songsData[x]);
          }
        }
      if (results.length > 0) {
        let updatedResults: SongData[] = results.map((x) => {
          const isBlacklisted = isSongBlacklisted(x.songId, x.path);
          const paletteData = getSelectedPaletteData(x.paletteId);

          return {
            ...x,
            artworkPaths: getSongArtworkPath(x.songId, x.isArtworkAvailable),
            paletteData,
            isBlacklisted
          };
        });

        if (noBlacklistedSongs)
          updatedResults = updatedResults.filter((result) => !result.isBlacklisted);

        return updatedResults;
      }
      logger.warn(`Failed to get songs info of songs`, {
        songIds
      });
      return [];
    }
    logger.error(`Failed to get songs info from get-song-info function. songs data are empty.`);
    return [];
  }
  logger.warn(`App made a request to get-song-info function with an empty array of song ids.`);
  return [];
};

export default getSongInfo;
