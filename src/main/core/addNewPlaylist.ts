import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';
import { storeArtworks } from '../other/artworks';
import { generateRandomId } from '../utils/randomId';

const createNewPlaylist = async (name: string, songIds?: string[], artworkPath?: string) => {
  try {
    const playlistId = generateRandomId();
    const artworkPaths = await storeArtworks(playlistId, 'playlist', artworkPath);
    const newPlaylist: SavablePlaylist = {
      name,
      playlistId,
      createdDate: new Date(),
      songs: Array.isArray(songIds) ? songIds : [],
      isArtworkAvailable: !artworkPaths.isDefaultArtwork
    };

    return { newPlaylist, newPlaylistArtworkPaths: artworkPaths };
  } catch (error) {
    log('Error occurred when creating a new playlist.', { error }, 'WARN');
    return;
  }
};

const addNewPlaylist = async (
  name: string,
  songIds?: string[],
  artworkPath?: string
): Promise<{ success: boolean; message?: string; playlist?: Playlist }> => {
  log(`Requested a creation of new playlist with a name ${name}`);
  const playlists = getPlaylistData();

  if (playlists && Array.isArray(playlists)) {
    if (playlists.some((playlist) => playlist.name === name)) {
      log(`Request failed because there is already a playlist named '${name}'.`);
      return {
        success: false,
        message: `Playlist with name '${name}' already exists.`
      };
    }

    const newPlaylistData = await createNewPlaylist(name, songIds, artworkPath);
    if (!newPlaylistData) return { success: false };

    const { newPlaylist, newPlaylistArtworkPaths } = newPlaylistData;

    playlists.push(newPlaylist);
    setPlaylistData(playlists);
    dataUpdateEvent('playlists/newPlaylist');

    return {
      success: true,
      playlist: { ...newPlaylist, artworkPaths: newPlaylistArtworkPaths }
    };
  }
  log(
    `ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST IS NOT AN ARRAY.`,
    { playlistsType: typeof playlists },
    'ERROR'
  );
  return { success: false };
};

export default addNewPlaylist;
