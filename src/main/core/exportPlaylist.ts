import { writeFile } from 'fs/promises';
import { basename } from 'path';
import type { SaveDialogOptions } from 'electron';

import logger from '../logger';
import { sendMessageToRenderer, showSaveDialog } from '../main';
import { getPlaylistWithSongPaths } from '@main/db/queries/playlists';

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

const createM3u8FileForPlaylist = async (
  playlistId: number,
  playlistName: string,
  songPaths: string[]
) => {
  const saveOptions = generateSaveDialogOptions(playlistName);

  try {
    const destination = await showSaveDialog(saveOptions);

    if (destination) {
      const m3u8DataArr = ['#EXTM3U', `#${basename(destination)}`, ''];

      m3u8DataArr.push(...songPaths);

      const m3u8FileData = m3u8DataArr.join('\n');

      await writeFile(destination, m3u8FileData);

      logger.debug(`Exported playlist successfully.`, { playlistId, playlistName });
      return sendMessageToRenderer({
        messageCode: 'PLAYLIST_EXPORT_SUCCESS',
        data: { playlistName }
      });
    }
    logger.warn(`Failed to export playlist because user didn't select a destination.`, {
      playlistName,
      playlistId
    });
    return sendMessageToRenderer({ messageCode: 'DESTINATION_NOT_SELECTED' });
  } catch (error) {
    logger.debug(`Failed to export playlist.`, { error, playlistName, playlistId });
    return sendMessageToRenderer({ messageCode: 'PLAYLIST_EXPORT_FAILED', data: { playlistName } });
  }
};

const exportPlaylist = async (playlistId: number) => {
  const playlist = await getPlaylistWithSongPaths(playlistId);

  if (playlist == null)
    return logger.warn("Failed to export playlist because requested playlist didn't exist", {
      playlistId
    });

  if (playlist.songs.length === 0)
    return logger.warn(
      "Failed to export playlist because requested playlist didn't have any songs.",
      {
        playlistId
      }
    );

  const songs = playlist.songs.map((s) => s.song.path);

  return await createM3u8FileForPlaylist(playlist.id, playlist.name, songs);
};

export default exportPlaylist;
