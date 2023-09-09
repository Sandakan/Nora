/* eslint-disable no-await-in-loop */
import log from '../log';
import { removeArtwork, storeArtworks } from '../other/artworks';
import { getPlaylistData, setPlaylistData } from '../filesystem';
import { dataUpdateEvent } from '../main';
import {
  getPlaylistArtworkPath,
  resetArtworkCache,
} from '../fs/resolveFilePaths';

const removePreviousArtwork = async (playlistId: string) => {
  const artworkPaths = getPlaylistArtworkPath(playlistId, true);
  removeArtwork(artworkPaths, 'playlist');
  return log('Successfully removed previous playlist artwork.');
};

export default async (playlistId: string, artworkPath: string) => {
  const playlists = getPlaylistData();

  for (let i = 0; i < playlists.length; i += 1) {
    if (playlists[i].playlistId === playlistId) {
      try {
        if (playlists[i].isArtworkAvailable)
          await removePreviousArtwork(playlistId);

        const artworkPaths = await storeArtworks(
          playlistId,
          'playlist',
          artworkPath,
        );

        playlists[i].isArtworkAvailable = !artworkPaths.isDefaultArtwork;

        resetArtworkCache('playlists');
        setPlaylistData(playlists);
        dataUpdateEvent('playlists');

        return artworkPaths;
      } catch (error) {
        log('Error occurred when adding an artwork to a playlist.', { error });
        throw error;
      }
    }
  }
  return undefined;
};
