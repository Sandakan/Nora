import {
  createNewListeningDataInstance,
  getListeningData,
  setListeningData,
} from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const updateSongListensArray = (
  yearlyListens: YearlyListeningRate[],
  updateValue: number,
) => {
  const currentDate = new Date();
  const currentNow = currentDate.getTime();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  for (const yearlyListen of yearlyListens) {
    if (yearlyListen.year === currentYear) {
      for (const listenData of yearlyListen.listens) {
        const [date] = listenData;

        if (typeof date === 'number' && typeof listenData[1] === 'number') {
          const songDate = new Date(date);
          const songMonth = songDate.getMonth();
          const songDay = songDate.getDate();

          if (currentMonth === songMonth && currentDay === songDay) {
            if (listenData[1] > 0) listenData[1] += updateValue;
            return yearlyListens;
          }
        }
      }
      yearlyListen.listens.push([currentNow, updateValue]);
      return yearlyListens;
    }
  }
  yearlyListens.push({
    year: currentYear,
    listens: [[currentNow, updateValue]],
  });
  return yearlyListens;
};

const updateSeeksArray = (
  availableSeeks = [] as SongSeek[],
  newSeeks: SongSeek[],
) => {
  const seekRange = 5;

  for (const newSeek of newSeeks) {
    for (const availableSeek of availableSeeks) {
      if (
        newSeek.position < availableSeek.position + seekRange &&
        newSeek.position > availableSeek.position - seekRange
      )
        availableSeek.seeks += newSeek.seeks;
    }
    availableSeeks.push(newSeek);
  }
  return availableSeeks;
};

const updateListeningDataProperties = (data = 0, value = 0) => {
  if (data + value < 0) return 0;
  return data + value;
};

const updateListeningData = <
  DataType extends keyof ListeningDataTypes,
  Value extends ListeningDataTypes[DataType],
>(
  dataType: DataType,
  listeningData: SongListeningData,
  value: Value,
) => {
  if (dataType === 'listens' && typeof value === 'number')
    listeningData.listens = updateSongListensArray(
      listeningData.listens,
      value,
    );
  else if (dataType === 'fullListens' && typeof value === 'number')
    listeningData.fullListens = updateListeningDataProperties(
      listeningData.fullListens,
      value,
    );
  else if (dataType === 'skips' && typeof value === 'number')
    listeningData.skips = updateListeningDataProperties(
      listeningData.skips,
      value,
    );
  else if (dataType === 'inNoOfPlaylists' && typeof value === 'number')
    listeningData.inNoOfPlaylists = updateListeningDataProperties(
      value,
      listeningData.inNoOfPlaylists,
    );
  else if (dataType === 'seeks' && Array.isArray(value))
    listeningData.seeks = updateSeeksArray(listeningData.seeks, value);
  else {
    log(
      `Requested to update song listening data with unknown data type of ${dataType}.`,
      undefined,
      'WARN',
    );
    throw new Error(
      `Requested to update song listening data with unknown data type of ${dataType}.`,
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
    [listeningData.songId],
  );
  return listeningData;
};

const updateSongListeningData = <
  DataType extends keyof ListeningDataTypes,
  Value extends ListeningDataTypes[DataType],
>(
  songId: string,
  dataType: DataType,
  value: Value,
) => {
  try {
    log(
      `Requested to ${
        typeof value === 'number'
          ? value >= 0
            ? 'increment'
            : 'decrement'
          : 'update'
      } ${dataType} of the '${songId}' song's listening data.`,
    );
    const listeningData = getListeningData([songId]);

    if (listeningData.length > 0) {
      for (let i = 0; i < listeningData.length; i += 1) {
        if (listeningData[i].songId === songId) {
          const updatedListeningData = updateListeningData(
            dataType,
            listeningData[i],
            value,
          );
          return setListeningData(updatedListeningData);
        }
      }

      log(
        `No listening data found for songId ${songId}. Creating a new listening data instance.`,
      );
      const newListeningData = createNewListeningDataInstance(songId);
      const updatedListeningData = updateListeningData(
        dataType,
        newListeningData,
        value,
      );
      return setListeningData(updatedListeningData);
    }
    return log('Listening data array empty');
  } catch (error) {
    return log(
      `Error occurred when trying to update song listening data for the song with id ${songId}`,
      { error },
      'ERROR',
    );
  }
};

export default updateSongListeningData;
