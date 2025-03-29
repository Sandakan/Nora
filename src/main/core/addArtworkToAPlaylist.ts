import { removeArtwork, storeArtworks } from '../other/artworks';
import { getPlaylistData, setPlaylistData } from '../filesystem';
import { dataUpdateEvent } from '../main';
import { getPlaylistArtworkPath, resetArtworkCache } from '../fs/resolveFilePaths';
import logger from '../logger';

const removePreviousArtwork = async (playlistId: string) => {
  const artworkPaths = getPlaylistArtworkPath(playlistId, true);
  removeArtwork(artworkPaths, 'playlist');
  return logger.debug('Successfully removed previous playlist artwork.');
};

const addArtworkToAPlaylist = async (playlistId: string, artworkPath: string) => {
  const playlists = getPlaylistData();

  for (let i = 0; i < playlists.length; i += 1) {
    if (playlists[i].playlistId === playlistId) {
      try {
        if (playlists[i].isArtworkAvailable) await removePreviousArtwork(playlistId);

        const artworkPaths = await storeArtworks(playlistId, 'playlist', artworkPath);

        playlists[i].isArtworkAvailable = !artworkPaths.isDefaultArtwork;

        resetArtworkCache('playlistArtworks');
        setPlaylistData(playlists);
        dataUpdateEvent('playlists');

        return artworkPaths;
      } catch (error) {
        logger.error('Failed to add an artwork to a playlist.', { error });
      }
    }
  }
  return undefined;
};

export default addArtworkToAPlaylist;
