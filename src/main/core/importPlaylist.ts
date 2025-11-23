import { readFile } from 'fs/promises';
import path from 'path';
import type { OpenDialogOptions } from 'electron';

import { sendMessageToRenderer, showOpenDialog } from '../main';
import logger from '../logger';
import { appPreferences } from '../../../package.json';
import addNewPlaylist from './addNewPlaylist';
import { getSongsInPathList } from '@main/db/queries/songs';
import { getPlaylistByName, linkSongsWithPlaylist } from '@main/db/queries/playlists';

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: `Select a Destination where your M3U8 file is`,
  buttonLabel: 'Select M3U8 file',
  properties: ['openFile'],
  filters: [
    { name: 'M3U8 Files', extensions: ['m3u8'] },
    { name: 'All Files', extensions: ['*'] }
  ]
};

const isASongPath = (text: string) => {
  const textLine = text.trim();
  const isTextLineAPath = path.isAbsolute(textLine);

  if (isTextLineAPath) {
    const textLinePath = textLine;
    const textLinePathExt =
      path.extname(textLinePath).split('.').pop() || path.extname(textLinePath);
    const isPathToASong = appPreferences.supportedMusicExtensions.includes(textLinePathExt);
    return isPathToASong;
  }
  return false;
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

          const availableSongs = await getSongsInPathList(songPaths);

          for (const songPath of songPaths) {
            const songData = availableSongs.find((song) => song.path === songPath);

            if (songData) availSongIdsForPlaylist.push(songData.id.toString());
            else unavailableSongPaths.push(songPath);
          }

          if (unavailableSongPaths.length > 0) {
            logger.debug(
              `Found ${unavailableSongPaths.length} songs outside the library when importing a playlist.`,
              { unavailableSongPaths }
            );
            sendMessageToRenderer({
              messageCode: 'PLAYLIST_IMPORT_SUCCESS',
              data: { count: availSongIdsForPlaylist.length }
            });
          }

          if (availSongIdsForPlaylist.length > 0) {
            const playlistName = fileName;

            const availablePlaylist = await getPlaylistByName(playlistName);

            if (availablePlaylist) {
              try {
                await linkSongsWithPlaylist(
                  availSongIdsForPlaylist.map((id) => Number(id)),
                  availablePlaylist.id
                );
                logger.debug(
                  `Imported ${availSongIdsForPlaylist.length} songs to the existing '${availablePlaylist.name}' playlist.`,
                  {
                    playlistName,
                    availSongIdsForPlaylistCount: availSongIdsForPlaylist.length,
                    availablePlaylistName: availablePlaylist.name
                  }
                );
                return sendMessageToRenderer({
                  messageCode: 'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST',
                  data: { count: availSongIdsForPlaylist.length, name: availablePlaylist.name }
                });
              } catch (error) {
                logger.error('Failed to import songs to an existing playlist.', {
                  playlistName,
                  error
                });
                return sendMessageToRenderer({
                  messageCode: 'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST_FAILED'
                });
              }
            } else {
              const res = await addNewPlaylist(playlistName, availSongIdsForPlaylist);

              if (res.success) {
                logger.info(`Imported '${fileName}' playlist successfully.`, { fileName });
                return sendMessageToRenderer({
                  messageCode: 'PLAYLIST_IMPORT_SUCCESS',
                  data: { name: fileName }
                });
              }

              logger.debug('Failed to create a playlist', { res });
              return sendMessageToRenderer({
                messageCode: 'PLAYLIST_IMPORT_FAILED'
              });
            }
          }
        }
        logger.warn(
          `Failed to import the playlist because user selected a file with invalid file data.`,
          { filePath, firstLine: textArr[0] }
        );
        return sendMessageToRenderer({
          messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_DATA'
        });
      }
      logger.warn(
        `Failed to import the playlist because user selected a file with a different extension other than 'm3u8'.`,
        { filePath }
      );
      return sendMessageToRenderer({
        messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_EXTENSION'
      });
    }
    logger.warn(`Failed to export a playlist because user didn't select a file.`);
    return sendMessageToRenderer({ messageCode: 'DESTINATION_NOT_SELECTED' });
  } catch (error) {
    logger.error(`Failed to import the playlist.`, { error });
    return sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
  }
};

export default importPlaylist;
