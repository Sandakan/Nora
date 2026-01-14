import { generateLocalArtworkBuffer } from '@main/updateSong/updateSongId3Tags';
import logger from '../logger';
import { dataUpdateEvent } from '../main';
import { storeArtworks } from '../other/artworks';
import { db } from '@main/db/db';
import {
  createPlaylist,
  getPlaylistById,
  getPlaylistByName,
  linkSongsWithPlaylist
} from '@main/db/queries/playlists';
import { convertToPlaylist } from '../utils/convert';
import { linkArtworkToPlaylist } from '@main/db/queries/artworks';

const createNewPlaylist = async (name: string, songIds?: string[], artworkPath?: string) => {
  try {
    const buffer = await generateLocalArtworkBuffer(artworkPath || '');

    const { playlist: newPlaylist, artworks: newArtworks } = await db.transaction(async (trx) => {
      const artworks = await storeArtworks('playlist', buffer, trx);

      const playlist = await createPlaylist(name, trx);

      if (artworks && artworks.length > 0) {
        await linkArtworkToPlaylist(playlist.id, artworks[0].id, trx);
      }

      if (songIds && songIds.length > 0) {
        await linkSongsWithPlaylist(
          songIds.map((id) => Number(id)),
          playlist.id,
          trx
        );
      }

      return { playlist, artworks };
    });

    dataUpdateEvent('playlists/newPlaylist');
    return { newPlaylist, artworks: newArtworks };
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
  const playlist = await getPlaylistByName(name);

  if (playlist) {
    logger.warn(`Request failed because there is already a playlist named '${name}'.`, {
      duplicatePlaylist: playlist
    });
    return {
      success: false,
      message: `Playlist with name '${name}' already exists.`
    };
  }

  const newPlaylistData = await createNewPlaylist(name, songIds, artworkPath);
  if (!newPlaylistData) return { success: false };

  const newPlaylist = await getPlaylistById(newPlaylistData.newPlaylist.id);
  if (!newPlaylist) return { success: false };

  return {
    success: true,
    playlist: convertToPlaylist(newPlaylist)
  };
};

export default addNewPlaylist;
