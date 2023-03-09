import path from 'path';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { getBlacklistData, setBlacklist } from '../filesystem';
import log from '../log';
import getSongInfo from './getSongInfo';

const restoreBlacklistedSongs = async (blacklistedSongIds: string[]) => {
  const blacklist = getBlacklistData();
  const filteredIds = blacklistedSongIds.filter(
    (id) => !blacklist.songBlacklist.includes(id)
  );
  blacklist.songBlacklist = blacklist.songBlacklist.filter(
    (blacklistedId) => !blacklistedSongIds.includes(blacklistedId)
  );

  if (filteredIds.length > 0) {
    const songsData = getSongInfo(filteredIds);
    for (const songData of songsData) {
      if (songData.isBlacklisted)
        sendMessageToRenderer(
          `'${songData.title}' cannot be whitelisted because its directory '${
            path.basename(path.dirname(songData.path)) || path
          }' is blacklisted. Whitelist the directory to whitelist the song.`
        );
    }
  }

  const restoredIds = blacklistedSongIds.filter(
    (id) => !filteredIds.includes(id)
  );

  if (restoredIds.length > 0) {
    sendMessageToRenderer(
      `${restoredIds.length} songs restored from the blacklist.`,
      'SONG_WHITELISTED',
      { restoredIds }
    );
  }

  setBlacklist(blacklist);
  dataUpdateEvent('blacklist/songBlacklist', restoredIds);
  log(
    'Song blacklist updated because some songs got removed from the blacklist.',
    { songIds: blacklistedSongIds },
    'INFO'
  );
};

export default restoreBlacklistedSongs;
