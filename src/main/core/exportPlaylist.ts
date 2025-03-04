import { writeFile } from 'fs/promises';
import { basename } from 'path';
import type { SaveDialogOptions } from 'electron';

import logger from '../logger';
import { getPlaylistData, getSongsData } from '../filesystem';
import { sendMessageToRenderer, showSaveDialog } from '../main';

const generateSaveDialogOptions = (playlistName: string) => {
  const saveOptions: SaveDialogOptions = {
    title: `Select the destination to save '${playlistName}' playlist`,
    buttonLabel: 'Save Playlist',
    defaultPath: playlistName,
    nameFieldLabel: playlistName,
    filters: [
      {
        extensions: ['m3u8'],
        name: 'M3U8 Files'
      }
    ],
    properties: ['createDirectory', 'showOverwriteConfirmation']
  };

  return saveOptions;
};

const createM3u8FileForPlaylist = async (playlist: SavablePlaylist) => {
  const songs = getSongsData();
  const { name, songs: playlistSongIds, playlistId } = playlist;
  const saveOptions = generateSaveDialogOptions(name);

  try {
    const destination = await showSaveDialog(saveOptions);
    if (destination) {
      const m3u8DataArr = ['#EXTM3U', `#${basename(destination)}`, ''];

      for (const song of songs) {
        if (playlistSongIds.includes(song.songId)) m3u8DataArr.push(song.path);
      }

      const m3u8FileData = m3u8DataArr.join('\n');

      await writeFile(destination, m3u8FileData);

      logger.debug(`Exported playlist successfully.`, { playlistId, name });
      return sendMessageToRenderer({ messageCode: 'PLAYLIST_EXPORT_SUCCESS', data: { name } });
    }
    logger.warn(`Failed to export playlist because user didn't select a destination.`, {
      name,
      playlistId
    });
    return sendMessageToRenderer({ messageCode: 'DESTINATION_NOT_SELECTED' });
  } catch (error) {
    logger.debug(`Failed to export playlist.`, { error, name, playlistId });
    return sendMessageToRenderer({ messageCode: 'PLAYLIST_EXPORT_FAILED', data: { name } });
  }
};

const exportPlaylist = (playlistId: string) => {
  const playlists = getPlaylistData();

  for (const playlist of playlists) {
    if (playlist.playlistId === playlistId) return createM3u8FileForPlaylist(playlist);
  }

  return logger.warn("Failed to export playlist because requested playlist didn't exist.", {
    playlistId
  });
};

export default exportPlaylist;
