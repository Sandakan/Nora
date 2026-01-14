import { getBlacklistData, setBlacklist } from '../filesystem';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const blacklistSongs = (songIds: number[]) => {
  const blacklist = getBlacklistData();

  blacklist.songBlacklist = Array.from(new Set([...blacklist.songBlacklist, ...songIds]));
  setBlacklist(blacklist);

  dataUpdateEvent('blacklist/songBlacklist');
  logger.debug('Song blacklist updated because a new songs got blacklisted.', { songIds });
};

export default blacklistSongs;
