import path from 'path';
import { BrowserWindow, dialog, OpenDialogOptions } from 'electron';
import { appPreferences } from '../../../package.json';
import log from '../log';
import parseFolderForSongPaths from '../fs/parseFolderForSongPaths';
import { parseSong } from '../parseSong';
import sortSongs from '../utils/sortSongs';
import { dataUpdateEvent } from '../main';

const addMusicFolder = async (
  mainWindowInstance: BrowserWindow,
  resultsSortType?: SongSortTypes
): Promise<SongData[]> => {
  log('Started the process of adding a new song to the music library');
  const openDialogOptions: OpenDialogOptions = {
    title: 'Add a Music Folder',
    buttonLabel: 'Add folder',
    filters: [
      {
        name: 'Audio Files',
        extensions: appPreferences.supportedMusicExtensions,
      },
    ],
    properties: ['openFile', 'openDirectory'],
  };
  const { canceled, filePaths: musicFolderPath } = await dialog.showOpenDialog(
    mainWindowInstance,
    openDialogOptions
  );

  if (canceled) {
    log('User cancelled the folder selection popup.');
    throw new Error('PROMPT_CLOSED_BEFORE_INPUT' as MessageCodes);
  }

  log(`Added a new song folder to the app - ${musicFolderPath[0]}`);
  const songPaths = await parseFolderForSongPaths(musicFolderPath[0]);
  console.time('parseTime');
  let songs: SongData[] = [];

  if (songPaths) {
    for (let i = 0; i < songPaths.length; i += 1) {
      const songPath = songPaths[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        const data = await parseSong(songPath);
        if (data) songs.push(data);
      } catch (error) {
        log(
          `Error occurred when parsing '${path.basename(songPath)}'.`,
          { error },
          'WARN'
        );
      }
    }
  } else throw new Error('Failed to get song paths from the folder.');

  if (resultsSortType) songs = sortSongs(songs, resultsSortType);

  log(
    `Successfully parsed ${songs.length} songs from '${
      musicFolderPath[0]
    }' directory.\nTIME_ELAPSED : ${console.timeEnd('parseTime')}`
  );
  dataUpdateEvent('userData/musicFolder');
  return songs;
};

export default addMusicFolder;
