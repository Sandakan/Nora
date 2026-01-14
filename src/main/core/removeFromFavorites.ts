import { updateSongFavoriteStatuses } from '@main/db/queries/songs';
import logger from '../logger';

const removeFromFavorites = async (
  songId: number
): Promise<{ success: boolean; message?: string }> => {
  logger.debug(`Requested to remove a song from the favorites.`, { songId });

  await updateSongFavoriteStatuses([songId], false);
  return { success: true };
};

export default removeFromFavorites;
