import { isSongBlacklisted } from '../utils/isBlacklisted';
import { getListeningData, getSongsData } from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortSongs from '../utils/sortSongs';
import paginateData from '../utils/paginateData';
import { getSelectedPaletteData } from '../other/generatePalette';
import filterSongs from '../utils/filterSongs';

const getAllSongs = async (
  sortType = 'aToZ' as SongSortTypes,
  filterType?: SongFilterTypes,
  paginatingData?: PaginatingData
) => {
  const songsData = getSongsData();
  const listeningData = getListeningData();

  let result = paginateData([] as AudioInfo[], sortType, paginatingData);

  if (songsData && songsData.length > 0) {
    const audioData: AudioInfo[] = sortSongs(
      filterSongs(songsData, filterType),
      sortType,
      listeningData
    ).map((songInfo) => {
      const isBlacklisted = isSongBlacklisted(songInfo.songId, songInfo.path);

      return {
        title: songInfo.title,
        artists: songInfo.artists,
        album: songInfo.album,
        duration: songInfo.duration,
        artworkPaths: getSongArtworkPath(songInfo.songId, songInfo.isArtworkAvailable),
        path: songInfo.path,
        year: songInfo.year,
        songId: songInfo.songId,
        paletteData: getSelectedPaletteData(songInfo.paletteId),
        addedDate: songInfo.addedDate,
        isAFavorite: songInfo.isAFavorite,
        isBlacklisted
      } as AudioInfo;
    });

    result = paginateData(audioData, sortType, paginatingData);
  }

  log(
    `Sending data related to all the songs with filters of sortType=${sortType} start=${result.start} end=${result.end}`
  );
  return result;
};

export default getAllSongs;
