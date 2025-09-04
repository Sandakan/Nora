import { addSongPlayEvent, addSongSeekEvent, addSongSkipEvent } from '@main/db/queries/listens';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const updateListeningData = async <
  DataType extends keyof ListeningDataTypes,
  Value extends ListeningDataTypes[DataType]
>(
  songId: string,
  dataType: DataType,
  value: Value
) => {
  if (dataType === 'listens' && typeof value === 'number')
    // TODO: Add the correct playback percentage value
    await addSongPlayEvent(Number(songId), '0.5');
  else if (dataType === 'fullListens' && typeof value === 'number')
    // TODO: Add the correct playback percentage value
    await addSongPlayEvent(Number(songId), '1.0');
  else if (dataType === 'skips' && typeof value === 'number')
    await addSongSkipEvent(Number(songId), value.toString());
  else if (dataType === 'seeks' && Array.isArray(value))
    await addSongSeekEvent(
      Number(songId),
      value.map((seek) => seek.position.toString())
    );
  else {
    logger.error(`Requested to update song listening data with unknown data type`, { dataType });
    throw new Error(
      `Requested to update song listening data with unknown data type of ${dataType}.`
    );
  }

  dataUpdateEvent(
    dataType === 'listens'
      ? 'songs/listeningData/listens'
      : dataType === 'fullListens'
        ? 'songs/listeningData/fullSongListens'
        : dataType === 'skips'
          ? 'songs/listeningData/skips'
          : 'songs/listeningData/inNoOfPlaylists',
    [songId]
  );
};

const updateSongListeningData = async <
  DataType extends keyof ListeningDataTypes,
  Value extends ListeningDataTypes[DataType]
>(
  songId: string,
  dataType: DataType,
  value: Value
) => {
  try {
    logger.debug(`Requested to update listening data.`, { songId, dataType, value });

    await updateListeningData(songId, dataType, value);
  } catch (error) {
    return logger.error(`Failed to update song listening data for a song`, {
      error,
      songId,
      dataType,
      value
    });
  }
};

export default updateSongListeningData;
