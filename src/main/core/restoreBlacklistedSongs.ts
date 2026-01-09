import path from 'path';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { getBlacklistData, setBlacklist } from '../filesystem';
import logger from '../logger';
import getSongInfo from './getSongInfo';

const restoreBlacklistedSongs = async (blacklistedSongIds: number[]) => {
  const blacklist = getBlacklistData();
  const filteredIds = blacklistedSongIds.filter((id) => !blacklist.songBlacklist.includes(id));
  blacklist.songBlacklist = blacklist.songBlacklist.filter(
    (blacklistedId) => !blacklistedSongIds.includes(blacklistedId)
  );

  if (filteredIds.length > 0) {
    const songsData = await getSongInfo(filteredIds);
    for (const songData of songsData) {
      if (songData.isBlacklisted)
        sendMessageToRenderer({
          messageCode: 'WHITELISTING_SONG_FAILED_DUE_TO_BLACKLISTED_DIRECTORY',
          data: {
            songName: songData.title,
            directoryName: path.basename(path.dirname(songData.path)) || songData.path
          }
        });
    }
  }

  const restoredIds = blacklistedSongIds.filter((id) => !filteredIds.includes(id));

  if (restoredIds.length > 0) {
    sendMessageToRenderer({
      messageCode: 'SONG_WHITELISTED',
      data: { count: restoredIds.length }
    });
  }

  setBlacklist(blacklist);
  dataUpdateEvent('blacklist/songBlacklist', restoredIds);
  logger.info('Song blacklist updated because some songs got removed from the blacklist.', {
    songIds: blacklistedSongIds
  });
};

export default restoreBlacklistedSongs;
