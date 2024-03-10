import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const clearSongHistory = () => {
  log('Started the cleaning process of the song history.');

  const playlistData = getPlaylistData();

  if (Array.isArray(playlistData) && playlistData.length > 0) {
    for (let i = 0; i < playlistData.length; i += 1) {
      if (playlistData[i].playlistId === 'History') playlistData[i].songs = [];
    }

    dataUpdateEvent('playlists/history');
    setPlaylistData(playlistData);
    log('Finished the song history cleaning process successfully.');
    return true;
  }
  log(
    `======= ERROR OCCURRED WHEN TRYING TO CLEAR THE SONG HISTORY. =======\nERROR: PLAYLIST DATA IS EMPTY OR NOT AN ARRAY`
  );
  throw new Error('Empty playlist data array.');
};

export default clearSongHistory;
