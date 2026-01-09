import { storeArtworks } from '../other/artworks';
import { dataUpdateEvent } from '../main';
import { resetArtworkCache } from '../fs/resolveFilePaths';
import logger from '../logger';
import { generateLocalArtworkBuffer } from '@main/updateSong/updateSongId3Tags';
import { linkArtworkToPlaylist } from '@main/db/queries/artworks';
import { db } from '@main/db/db';

// const removePreviousArtwork = async (playlistId: string) => {
//   const artworkPaths = getPlaylistArtworkPath(playlistId, true);
//   removeArtwork(artworkPaths, 'playlist');
//   return logger.debug('Successfully removed previous playlist artwork.');
// };

const addArtworkToAPlaylist = async (playlistId: number, artworkPath: string) => {
  try {
    const buffer = await generateLocalArtworkBuffer(artworkPath || '');

    await db.transaction(async (trx) => {
      // TODO: Remove previous artwork if exists
      const artworks = await storeArtworks('playlist', buffer, trx);

      if (artworks && artworks.length > 0) {
        await linkArtworkToPlaylist(playlistId, artworks[0].id, trx);
      }
    });
    resetArtworkCache('playlistArtworks');
    dataUpdateEvent('playlists');

    return undefined;
  } catch (error) {
    logger.error('Failed to add an artwork to a playlist.', { error });
  }
};

export default addArtworkToAPlaylist;
