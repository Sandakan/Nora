import { dataUpdateEvent } from '../main';
import { getBlacklistData, setBlacklist } from '../filesystem';
import log from '../log';

const restoreBlacklistedSongs = async (blacklistedSongIds: string[]) => {
  const blacklist = getBlacklistData();

  blacklist.songBlacklist = blacklist.songBlacklist.filter(
    (blacklistedId) => !blacklistedSongIds.includes(blacklistedId)
  );

  setBlacklist(blacklist);
  dataUpdateEvent('blacklist/songBlacklist');
  log(
    'Song blacklist updated because some songs got removed from the blacklist.',
    { songIds: blacklistedSongIds },
    'INFO'
  );
};

export default restoreBlacklistedSongs;
