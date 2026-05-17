import { addSongsToBlacklist } from '@main/db/queries/blacklist';

import logger from '../logger';
import { dataUpdateEvent } from '../main';

const blacklistSongs = async (songIds: number[]) => {
  await addSongsToBlacklist(songIds);

  dataUpdateEvent('blacklist/songBlacklist');
  logger.debug('Song blacklist updated because a new songs got blacklisted.', { songIds });
};

export default blacklistSongs;
