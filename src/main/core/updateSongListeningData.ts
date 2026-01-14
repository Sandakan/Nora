import { addSongPlayEvent, addSongSeekEvent, addSongSkipEvent } from '@main/db/queries/listens';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const updateSongListeningData = async (
  songId: number,
  dataType: ListeningDataEvents,
  value: number
) => {
  try {
    logger.debug(`Requested to update listening data.`, { songId, dataType, value });

    if (dataType === 'LISTEN' && typeof value === 'number')
      await addSongPlayEvent(songId, value.toString());
    else if (dataType === 'SKIP' && typeof value === 'number')
      await addSongSkipEvent(songId, value.toString());
    else if (dataType === 'SEEK' && typeof value === 'number')
      await addSongSeekEvent(songId, value.toString());
    else {
      logger.error(`Requested to update song listening data with unknown data type`, { dataType });
      throw new Error(
        `Requested to update song listening data with unknown data type of ${dataType}.`
      );
    }

    dataUpdateEvent(
      dataType === 'LISTEN'
        ? 'songs/listeningData/listens'
        : dataType === 'SKIP'
          ? 'songs/listeningData/skips'
          : 'songs/listeningData/inNoOfPlaylists',
      [songId]
    );
  } catch (error) {
    logger.error(`Failed to update song listening data`, { songId, dataType, value, error });
  }
};

export default updateSongListeningData;
