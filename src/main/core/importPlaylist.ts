import { OpenDialogOptions } from 'electron';
import { readFile } from 'fs/promises';
import path from 'path';

import { showOpenDialog } from '../main';
import log from '../log';
import { getSongsData } from '../filesystem';
import { appPreferences } from '../../../package.json';
import addNewPlaylist from './addNewPlaylist';

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: `Select a Destination where your M3U8 file is`,
  buttonLabel: 'Select M3U8 file',
  properties: ['openFile'],
  filters: [
    { name: 'M3U8 Files', extensions: ['m3u8'] },
    { name: 'All Files', extensions: ['*'] },
  ],
};

const isASongPath = (text: string) => {
  const textLine = text.trim();
  const isTextLineAPath = path.isAbsolute(textLine);

  if (isTextLineAPath) {
    const textLinePath = textLine;
    const textLinePathExt =
      path.extname(textLinePath).split('.').pop() || path.extname(textLinePath);
    const isPathToASong =
      appPreferences.supportedMusicExtensions.includes(textLinePathExt);
    return isPathToASong;
  }
  return false;
};

const getSongDataFromSongPath = (songPath: string) => {
  const songs = getSongsData();
  for (const song of songs) {
    if (song.path === songPath) return song;
  }
  return undefined;
};

const importPlaylist = async () => {
  try {
    const destinations = await showOpenDialog(DEFAULT_EXPORT_DIALOG_OPTIONS);

    if (destinations) {
      const [filePath] = destinations;

      if (path.extname(filePath) === '.m3u8') {
        const fileName = path.basename(filePath).replace(/\.m3u8$/gim, '');
        const text = await readFile(filePath, 'utf-8');
        const textArr = text.replaceAll('\r', '').split('\n');

        if (textArr[0] === '#EXTM3U') {
          const unavailableSongPaths: string[] = [];
          const availSongIdsForPlaylist: string[] = [];

          const songPaths = textArr.filter((line) => isASongPath(line));

          for (const songPath of songPaths) {
            const songData = getSongDataFromSongPath(songPath);

            if (songData) availSongIdsForPlaylist.push(songData.songId);
            else unavailableSongPaths.push(songPath);
          }

          if (unavailableSongPaths.length > 0)
            log(
              `Found ${unavailableSongPaths.length} songs outside the library when importing a playlist which is not supported.`,
              undefined,
              'INFO',
              {
                sendToRenderer: 'FAILURE',
              }
            );

          if (availSongIdsForPlaylist.length > 0) {
            const res = await addNewPlaylist(fileName, availSongIdsForPlaylist);

            if (res.success)
              return log(
                `Imported '${fileName}' playlist successfully.`,
                undefined,
                'INFO',
                {
                  sendToRenderer: 'SUCCESS',
                }
              );
            return log(
              res.message || 'Failed to create a playlist',
              { res },
              'ERROR',
              { sendToRenderer: 'FAILURE' }
            );
          }
        }
        return log(
          `Failed to import the playlist because user selected a file with invalid file data.`,
          { filePath, firstLine: textArr[0] },
          'ERROR',
          {
            sendToRenderer: 'FAILURE',
          }
        );
      }
      return log(
        `Failed to import the playlist because user selected a file with a different extension other than 'm3u8'.`,
        { filePath },
        'ERROR',
        {
          sendToRenderer: 'FAILURE',
        }
      );
    }
    return log(
      `Failed to export a playlist because user didn't select a file.`,
      undefined,
      'WARN',
      {
        sendToRenderer: 'FAILURE',
      }
    );
  } catch (error) {
    return log(`Failed to import the playlist.`, { error }, 'ERROR', {
      sendToRenderer: 'FAILURE',
    });
  }
};

export default importPlaylist;
