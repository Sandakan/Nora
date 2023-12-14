import { writeFile } from 'fs/promises';
import { basename } from 'path';
import { SaveDialogOptions } from 'electron';

import log from '../log';
import { getPlaylistData, getSongsData } from '../filesystem';
import { showSaveDialog } from '../main';

const generateSaveDialogOptions = (playlistName: string) => {
  const saveOptions: SaveDialogOptions = {
    title: `Select the destination to save '${playlistName}' playlist`,
    buttonLabel: 'Save Playlist',
    defaultPath: playlistName,
    nameFieldLabel: playlistName,
    filters: [
      {
        extensions: ['m3u8'],
        name: 'M3U8 Files',
      },
    ],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
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

      return log(
        `Exported '${name}' playlist successfully.`,
        undefined,
        'INFO',
        {
          sendToRenderer: {
            messageCode: 'PLAYLIST_EXPORT_SUCCESS',
            data: { name },
          },
        },
      );
    }
    return log(
      `Failed to export '${name}' playlist because user didn't select a destination.`,
      { name, playlistId },
      'WARN',
      {
        sendToRenderer: { messageCode: 'DESTINATION_NOT_SELECTED' },
      },
    );
  } catch (error) {
    return log(
      `Failed to export '${name}' playlist.`,
      { error, name, playlistId },
      'ERROR',
      {
        sendToRenderer: {
          messageCode: 'PLAYLIST_EXPORT_FAILED',
          data: { name },
        },
      },
    );
  }
};

const exportPlaylist = (playlistId: string) => {
  const playlists = getPlaylistData();

  for (const playlist of playlists) {
    if (playlist.playlistId === playlistId)
      return createM3u8FileForPlaylist(playlist);
  }

  return log(
    "Failed to export playlist because requested playlist didn't exist.",
    { playlistId },
    'ERROR',
  );
};

export default exportPlaylist;
