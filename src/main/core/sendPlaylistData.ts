import { getAllPlaylists } from '@main/db/queries/playlists';
import { convertToPlaylist } from '../utils/convert';

const sendPlaylistData = async (
  playlistIds = [] as string[],
  sortType?: PlaylistSortTypes,
  start = 0,
  end = 0,
): Promise<PaginatedResult<Playlist, PlaylistSortTypes>> => {
  const playlists = await getAllPlaylists({
    playlistIds: playlistIds.map((id) => Number(id)).filter((id) => !isNaN(id)),
    start,
    end,
    sortType
  });

  const results: Playlist[] = playlists.data.map((playlist) => convertToPlaylist(playlist));

  // return onlyMutablePlaylists
  //   ? updatedResults.filter((result) => result.playlistId !== 'History')
  //   : updatedResults;
  return {
    data: results,
    total: results.length,
    sortType: playlists.sortType,
    start: playlists.start,
    end: playlists.end
  };
};

export default sendPlaylistData;
