import { isSongBlacklisted } from './isBlacklisted';

function filterSongs<T extends (SavableSongData | SongData)[]>(
  data: T,
  filterType?: SongFilterTypes
  //   listeningData?: SongListeningData[]
): T {
  if (data && data.length > 0 && filterType) {
    if (filterType === 'notSelected') return data;

    if (filterType === 'blacklistedSongs')
      return data.filter((song) => isSongBlacklisted(song.songId, song.path)) as T;
    if (filterType === 'whitelistedSongs')
      return data.filter((song) => !isSongBlacklisted(song.songId, song.path)) as T;
  }

  return data;
}

export default filterSongs;
