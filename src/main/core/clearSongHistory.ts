import { getPlaylistData, setPlaylistData } from '../filesystem';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const clearSongHistory = () => {
  logger.debug('Started the cleaning process of the song history.');

  const playlistData = getPlaylistData();

  if (Array.isArray(playlistData) && playlistData.length > 0) {
    for (let i = 0; i < playlistData.length; i += 1) {
      if (playlistData[i].playlistId === 'History') playlistData[i].songs = [];
    }

    dataUpdateEvent('playlists/history');
    setPlaylistData(playlistData);
    logger.debug('Finished the song history cleaning process successfully.');
    return true;
  }
  return logger.error(
    `Failed to clear the song history because playlist data is empty or not an array`
  )({
    throwNewError: true
  });
};

export default clearSongHistory;
