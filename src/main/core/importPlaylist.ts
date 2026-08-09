import { readFile, stat } from 'fs/promises';
import path from 'path';

import { SpecialPlaylists } from '@common/playlists.enum';
import { getPlaylistByName, linkSongsWithPlaylist } from '@main/db/queries/playlists';
import { getSongsInPathList, updateSongFavoriteStatuses } from '@main/db/queries/songs';
import type { OpenDialogOptions } from 'electron';

import { appPreferences } from '../../../package.json';
import logger from '../logger';
import { dataUpdateEvent, sendMessageToRenderer, showOpenDialog } from '../main';
import addNewPlaylist from './addNewPlaylist';

const DEFAULT_IMPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: `Select a Destination where your M3U8/M3U file is`,
  buttonLabel: 'Select M3U8/M3U file',
  properties: ['openFile', 'multiSelections'],
  filters: [
    { name: 'M3U8/M3U Files', extensions: ['m3u8', 'm3u'] },
    { name: 'All Files', extensions: ['*'] }
  ]
};

const isASongPath = (text: string, playlistDir?: string) => {
  const textLine = text.trim();
  const resolvedPath = path.isAbsolute(textLine)
    ? textLine
    : (playlistDir && path.resolve(playlistDir, textLine)) || '';

  if (!resolvedPath) return false;

  const ext = (path.extname(resolvedPath).split('.').pop() || path.extname(resolvedPath)).toLowerCase();
  return appPreferences.supportedMusicExtensions.includes(ext);
};

type ResolvedSongIds = {
  availableIds: number[];
  unavailablePaths: string[];
  deduplicatedCount: number;
  totalExtracted: number;
};

const validatePlaylistFile = async (
  filePath: string
): Promise<{ fileName: string; textArr: string[] } | null> => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.m3u8' && ext !== '.m3u') {
    logger.warn(
      `Failed to import the playlist because user selected a file with a different extension other than 'm3u8' or 'm3u'.`,
      { filePath }
    );
    sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_EXTENSION' });
    return null;
  }

  const fileName = path.basename(filePath).replace(/\.m3u8?$/gim, '');

  // Reject oversized files before reading the whole thing into memory. Playlist
  // files are small text; anything past a few tens of MB is almost certainly
  // not a real playlist and would needlessly pressure memory.
  const MAX_PLAYLIST_FILE_SIZE = 25 * 1024 * 1024;
  try {
    const stats = await stat(filePath);
    if (stats.size > MAX_PLAYLIST_FILE_SIZE) {
      logger.warn('Rejected oversized playlist file.', { filePath, size: stats.size });
      sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
      return null;
    }
  } catch {
    logger.warn('Failed to access playlist file during validation.', { filePath });
    sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
    return null;
  }

  const text = await readFile(filePath, 'utf-8');
  const textArr = text.replaceAll('\r', '').split('\n');

  // .m3u8 is the extended format and requires the #EXTM3U header. A basic
  // .m3u file may be a plain list of media paths with no header, so only
  // reject it after parsing finds no valid media paths (handled downstream).
  if (ext === '.m3u8' && textArr[0].replace(/^\uFEFF/, '').trim() !== '#EXTM3U') {
    logger.warn(
      `Failed to import the playlist because user selected a file with invalid file data.`,
      { filePath, firstLine: textArr[0] }
    );
    sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_DATA' });
    return null;
  }

  return { fileName, textArr };
};

const resolveSongIds = async (textArr: string[], playlistDir?: string): Promise<ResolvedSongIds> => {
  const resolvePath = (line: string): string | null => {
    const textLine = line.trim();
    if (path.isAbsolute(textLine)) return textLine;
    if (playlistDir) return path.resolve(playlistDir, textLine);
    return null;
  };

  const songPathsRaw: string[] = [];
  for (const line of textArr) {
    const resolved = resolvePath(line);
    if (resolved && isASongPath(line, playlistDir)) {
      songPathsRaw.push(resolved);
    }
  }
  const songPaths = Array.from(new Set(songPathsRaw));
  const availableSongs = await getSongsInPathList(songPaths);
  const songsByPath = new Map(availableSongs.map((song) => [song.path, song]));

  const availableIds: number[] = [];
  const unavailablePaths: string[] = [];

  for (const songPath of songPaths) {
    const songData = songsByPath.get(songPath);
    if (songData) availableIds.push(Number(songData.id));
    else unavailablePaths.push(songPath);
  }

  return {
    availableIds,
    unavailablePaths,
    deduplicatedCount: songPathsRaw.length - songPaths.length,
    totalExtracted: songPaths.length
  };
};

const importToFavorites = async (
  songIdNumbers: number[],
  fileName: string,
  unavailableCount: number,
  deduplicatedCount: number
) => {
  try {
    await updateSongFavoriteStatuses(songIdNumbers, true);
    dataUpdateEvent('songs/likes', songIdNumbers);

    logger.info(`Imported ${songIdNumbers.length} songs to Favorites playlist.`, {
      fileName,
      importedCount: songIdNumbers.length,
      unavailableCount,
      deduplicatedCount
    });

    return sendMessageToRenderer({
      messageCode: 'PLAYLIST_IMPORT_SUCCESS',
      data: { name: 'Favorites', count: songIdNumbers.length }
    });
  } catch (error) {
    logger.error('Failed to mark songs as favorite during Favorites import.', { fileName, error });
    return sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
  }
};

const importToPlaylist = async (songIdNumbers: number[], playlistName: string) => {
  const availablePlaylist = await getPlaylistByName(playlistName);

  if (availablePlaylist) {
    try {
      await linkSongsWithPlaylist(songIdNumbers, availablePlaylist.id);
      dataUpdateEvent('playlists/newSong', songIdNumbers);

      logger.debug(
        `Imported ${songIdNumbers.length} songs to the existing '${availablePlaylist.name}' playlist.`,
        {
          playlistName,
          availSongIdsForPlaylistCount: songIdNumbers.length,
          availablePlaylistName: availablePlaylist.name
        }
      );

      return sendMessageToRenderer({
        messageCode: 'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST',
        data: { count: songIdNumbers.length, name: availablePlaylist.name }
      });
    } catch (error) {
      logger.error('Failed to import songs to an existing playlist.', { playlistName, error });
      return sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST_FAILED' });
    }
  }

  const res = await addNewPlaylist(
    playlistName,
    songIdNumbers.map((id) => id.toString())
  );

  if (res.success) {
    logger.info(`Imported '${playlistName}' playlist successfully.`, { fileName: playlistName });
    return sendMessageToRenderer({
      messageCode: 'PLAYLIST_IMPORT_SUCCESS',
      data: { name: playlistName }
    });
  }

  logger.debug('Failed to create a playlist', { res });
  return sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
};

export const processPlaylistImport = async (filePath: string, targetPlaylistId?: number) => {
  try {
    const validated = await validatePlaylistFile(filePath);
    if (!validated) return;

    const { fileName, textArr } = validated;
    const playlistDir = path.dirname(filePath);
    const { availableIds, unavailablePaths, deduplicatedCount, totalExtracted } =
      await resolveSongIds(textArr, playlistDir);

    if (unavailablePaths.length > 0) {
      logger.debug(
        `Found ${unavailablePaths.length} songs outside the library when importing a playlist.`,
        { unavailablePaths }
      );
    }

    if (availableIds.length === 0) {
      if (totalExtracted === 0) {
        return sendMessageToRenderer({
          messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_DATA'
        });
      }
      return sendMessageToRenderer({
        messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_SONGS_OUTSIDE_LIBRARY'
      });
    }

    const isImportingToFavorites =
      targetPlaylistId === SpecialPlaylists.Favorites || fileName.toLowerCase().includes('favorites');

    if (isImportingToFavorites) {
      return importToFavorites(availableIds, fileName, unavailablePaths.length, deduplicatedCount);
    }

    return importToPlaylist(availableIds, fileName);
  } catch (error) {
    logger.error(`Failed to import the playlist from path.`, { error, filePath });
    return sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
  }
};

const importPlaylist = async (targetPlaylistId?: number, playlistPath?: string) => {
  try {
    if (playlistPath) {
      return processPlaylistImport(playlistPath, targetPlaylistId);
    }

    const destinations = await showOpenDialog(DEFAULT_IMPORT_DIALOG_OPTIONS);

    if (destinations) {
      for (const filePath of destinations) {
        await processPlaylistImport(filePath, targetPlaylistId);
      }
    } else {
      logger.warn(`Failed to export a playlist because user didn't select a file.`);
      sendMessageToRenderer({ messageCode: 'DESTINATION_NOT_SELECTED' });
    }
  } catch (error) {
    logger.error(`Failed to import the playlist.`, { error });
    sendMessageToRenderer({ messageCode: 'PLAYLIST_IMPORT_FAILED' });
  }
};

export default importPlaylist;
