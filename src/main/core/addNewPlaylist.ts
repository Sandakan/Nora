import { getPlaylistData, setPlaylistData } from '../filesystem';
import logger from '../logger';
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
    logger.error('Failed to create a new playlist.', { error });
    return;
  }
};

const addNewPlaylist = async (
  name: string,
  songIds?: string[],
  artworkPath?: string
): Promise<{ success: boolean; message?: string; playlist?: Playlist }> => {
  logger.debug(`Requested a creation of new playlist with a name ${name}`);
  const playlists = getPlaylistData();

  if (playlists && Array.isArray(playlists)) {
    const duplicatePlaylist = playlists.find((playlist) => playlist.name === name);

    if (duplicatePlaylist) {
      logger.warn(`Request failed because there is already a playlist named '${name}'.`, {
        duplicatePlaylist
      });
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
  logger.error(`Failed to add a song to the favorites. Playlist is not an array.`, {
    playlistsType: typeof playlists
  });
  return { success: false };
};

export default addNewPlaylist;
