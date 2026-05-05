import type { GetAllSongsReturnType } from '@main/db/queries/songs';

function filterSongs(data: GetAllSongsReturnType, filterType?: SongFilterTypes) {
  if (data && data.length > 0 && filterType) {
    if (filterType === 'notSelected') return data;

    if (filterType === 'blacklistedSongs') return data.filter((song) => song.isBlacklisted);
    if (filterType === 'whitelistedSongs') return data.filter((song) => !song.isBlacklisted);
  }

  return data;
}

export default filterSongs;
