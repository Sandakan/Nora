import { clearFullSongHistory } from '@main/db/queries/history';
import logger from '../logger';

const clearSongHistory = async () => {
  logger.debug('Started the cleaning process of the song history.');

  await clearFullSongHistory();
};

export default clearSongHistory;
