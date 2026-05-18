import { readFile } from 'fs/promises';
import path from 'path';

import { SpecialPlaylists } from '@common/playlists.enum';
import { getPlaylistByName, linkSongsWithPlaylist } from '@main/db/queries/playlists';
import { getSongsInPathList, updateSongFavoriteStatuses } from '@main/db/queries/songs';
import type { OpenDialogOptions } from 'electron';

import { appPreferences } from '../../../package.json';
import logger from '../logger';
import { sendMessageToRenderer, showOpenDialog } from '../main';
import addNewPlaylist from './addNewPlaylist';

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: `Select a Destination where your M3U8 file is`,
  buttonLabel: 'Select M3U8 file',
  properties: ['openFile'],
  filters: [
    { name: 'M3U8 Files', extensions: ['m3u8', 'm3u'] },
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

const parseAndImportPlaylistFromPath = async (
  filePath: string,
  targetPlaylistId?: number
): Promise<void> => {
  if (!/\.(m3u8|m3u)$/i.test(filePath)) {
    sendMessageToRenderer({
      messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_EXTENSION'
    });
    return;
  }

  const fileName = path.basename(filePath).replace(/\.(m3u8|m3u)$/gim, '');
  const text = await readFile(filePath, 'utf-8');
  const textArr = text.replaceAll('\r', '').split('\n');

  if (textArr[0] !== '#EXTM3U') {
    logger.warn(`Failed to import playlist: invalid file data.`, {
      filePath,
      firstLine: textArr[0]
    });
    sendMessageToRenderer({
      messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_DATA'
    });
    return;
  }

  const unavailableSongPaths: string[] = [];
  const availSongIdsForPlaylist: string[] = [];

  const songPathsRaw = textArr.filter((line) => isASongPath(line));
  const songPaths = Array.from(new Set(songPathsRaw));

  const availableSongs = await getSongsInPathList(songPaths);

  for (const songPath of songPaths) {
    const songData = availableSongs.find((song) => song.path === songPath);

    if (songData) availSongIdsForPlaylist.push(songData.id.toString());
    else unavailableSongPaths.push(songPath);
  }

  const isImportingToFavorites =
    targetPlaylistId === SpecialPlaylists.Favorites ||
    fileName.toLowerCase().includes('Favorites');

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

  if (availSongIdsForPlaylist.length === 0) return;

  const songIdNumbers = availSongIdsForPlaylist.map((id) => Number(id));

  if (isImportingToFavorites) {
    try {
      await updateSongFavoriteStatuses(songIdNumbers, true);
      logger.info(`Imported ${songIdNumbers.length} songs to Favorites playlist.`, {
        fileName,
        importedCount: songIdNumbers.length,
        unavailableCount: unavailableSongPaths.length,
        deduplicatedCount: songPathsRaw.length - songPaths.length
      });
      sendMessageToRenderer({
        messageCode: 'PLAYLIST_IMPORT_SUCCESS',
        data: { name: 'Favorites', count: songIdNumbers.length }
      });
    } catch (error) {
      logger.error('Failed to mark songs as favorite during Favorites import.', {
        fileName,
        error
      });
      sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
    }
    return;
  }

  const playlistName = fileName;
  const availablePlaylist = await getPlaylistByName(playlistName);

  if (availablePlaylist) {
    try {
      await linkSongsWithPlaylist(songIdNumbers, availablePlaylist.id);
      logger.debug(
        `Imported ${songIdNumbers.length} songs to existing '${availablePlaylist.name}' playlist.`,
        { playlistName, availSongIdsForPlaylistCount: songIdNumbers.length, availablePlaylistName: availablePlaylist.name }
      );
      sendMessageToRenderer({
        messageCode: 'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST',
        data: { count: songIdNumbers.length, name: availablePlaylist.name }
      });
    } catch (error) {
      logger.error('Failed to import songs to an existing playlist.', { playlistName, error });
      sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST_FAILED' });
    }
    return;
  }

  const res = await addNewPlaylist(
    playlistName,
    songIdNumbers.map((id) => id.toString())
  );

  if (res.success) {
    logger.info(`Imported '${fileName}' playlist successfully.`, { fileName });
    sendMessageToRenderer({
      messageCode: 'PLAYLIST_IMPORT_SUCCESS',
      data: { name: fileName }
    });
  } else {
    logger.debug('Failed to create a playlist', { res });
    sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
  }
};

const importPlaylist = async (targetPlaylistId?: number) => {
  try {
    const destinations = await showOpenDialog(DEFAULT_EXPORT_DIALOG_OPTIONS);

    if (destinations) {
      const [filePath] = destinations;

      if (!filePath) {
        logger.warn(`Failed to import a playlist because user didn't select a file.`);
        sendMessageToRenderer({ messageCode: 'DESTINATION_NOT_SELECTED' });
        return;
      }

      await parseAndImportPlaylistFromPath(filePath, targetPlaylistId);
    } else {
      logger.warn(`Failed to import a playlist because user didn't select a file.`);
      sendMessageToRenderer({ messageCode: 'DESTINATION_NOT_SELECTED' });
    }
  } catch (error) {
    logger.error(`Failed to import the playlist.`, { error });
    sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
  }
};

const importPlaylistFromPath = async (filePath: string, targetPlaylistId?: number) => {
  try {
    await parseAndImportPlaylistFromPath(filePath, targetPlaylistId);
  } catch (error) {
    logger.error(`Failed to import the playlist from path.`, { error, filePath });
    sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
  }
};

export default importPlaylist;
export { importPlaylistFromPath };
