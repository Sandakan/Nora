import { getBlacklistData, setBlacklist } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const blacklistSongs = (songIds: string[]) => {
  const blacklist = getBlacklistData();

  blacklist.songBlacklist = Array.from(
    new Set([...blacklist.songBlacklist, ...songIds]),
  );
  setBlacklist(blacklist);

  dataUpdateEvent('blacklist/songBlacklist');
  log(
    'Song blacklist updated because a new songs got blacklisted.',
    { songIds },
    'INFO',
  );
};

export default blacklistSongs;
