import { getPlaylistData } from '../filesystem';
import { getPlaylistArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortPlaylists from '../utils/sortPlaylists';

const sendPlaylistData = (
  playlistIds = [] as string[],
  sortType?: PlaylistSortTypes,
  onlyMutablePlaylists = false
): Playlist[] => {
  const playlists = getPlaylistData();
  if (playlistIds && playlists && Array.isArray(playlists)) {
    let results: SavablePlaylist[] = [];
    log(`Requested playlists data for ids '${playlistIds.join(',')}'`);
    if (playlistIds.length === 0) results = playlists;
    else {
      for (let x = 0; x < playlists.length; x += 1) {
        for (let y = 0; y < playlistIds.length; y += 1) {
          if (playlists[x].playlistId === playlistIds[y]) results.push(playlists[x]);
        }
      }
    }
    if (sortType) results = sortPlaylists(results, sortType);
    const updatedResults: Playlist[] = results.map((x) => ({
      ...x,
      artworkPaths: getPlaylistArtworkPath(x.playlistId, x.isArtworkAvailable)
    }));
    return onlyMutablePlaylists
      ? updatedResults.filter((result) => result.playlistId !== 'History')
      : updatedResults;
  }
  return [];
};

export default sendPlaylistData;
