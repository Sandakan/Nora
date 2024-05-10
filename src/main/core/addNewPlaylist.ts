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
    throw error;
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

    try {
      const { newPlaylist, newPlaylistArtworkPaths } = await createNewPlaylist(
        name,
        songIds,
        artworkPath
      );

      playlists.push(newPlaylist);
      setPlaylistData(playlists);
      dataUpdateEvent('playlists/newPlaylist');

      return {
        success: true,
        playlist: { ...newPlaylist, artworkPaths: newPlaylistArtworkPaths }
      };
    } catch (error) {
      log(`Error occurred when adding a new playlist.`);
      throw new Error('Playlists is not an array.');
    }
  }
  log(`ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`);
  throw new Error('Playlists is not an array.');
};

export default addNewPlaylist;
