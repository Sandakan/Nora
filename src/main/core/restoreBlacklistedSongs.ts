import { restoreSongsFromBlacklist } from '@main/db/queries/blacklist';

import logger from '../logger';
import { dataUpdateEvent } from '../main';

const restoreBlacklistedSongs = async (blacklistedSongIds: number[]) => {
  await restoreSongsFromBlacklist(blacklistedSongIds);

  dataUpdateEvent('blacklist/songBlacklist', blacklistedSongIds);
  logger.info('Song blacklist updated because some songs got removed from the blacklist.', {
    songIds: blacklistedSongIds
  });
};

export default restoreBlacklistedSongs;
