import {
  createNewListeningDataInstance,
  getListeningData,
  setListeningData,
} from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const incrementListeningDataProperties = (
  dataUpdateType: ListeningDataUpdateTypes,
  data = 0
) => {
  const value = dataUpdateType === 'increment' ? 1 : -1;
  if (data + value < 0) return 0;
  return data + value;
};

const updateSongListensArray = (
  updateType: ListeningDataUpdateTypes,
  yearlyListens: YearlyListeningRate[]
) => {
  const currentDate = new Date();
  const currentNow = currentDate.getTime();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  const updateValue = updateType === 'increment' ? 1 : -1;

  for (const yearlyListen of yearlyListens) {
    if (yearlyListen.year === currentYear) {
      for (const listenData of yearlyListen.listens) {
        const date = listenData[0];

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
      yearlyListen.listens.push([
        currentNow,
        updateType === 'increment' ? 1 : 0,
      ]);
      return yearlyListens;
    }
  }
  yearlyListens.push({
    year: currentYear,
    listens: [[currentNow, updateType === 'increment' ? 1 : 0]],
  });
  return yearlyListens;
};

const updateListeningData = (
  dataType: ListeningDataTypes,
  listeningData: SongListeningData,
  updateType: ListeningDataUpdateTypes
) => {
  if (dataType === 'fullListens') {
    listeningData.fullListens = incrementListeningDataProperties(
      updateType,
      listeningData.fullListens
    );
  } else if (dataType === 'skips') {
    listeningData.skips = incrementListeningDataProperties(
      updateType,
      listeningData.skips
    );
  } else if (dataType === 'noOfPlaylists') {
    listeningData.inNoOfPlaylists = incrementListeningDataProperties(
      updateType,
      listeningData.inNoOfPlaylists
    );
  } else if (dataType === 'listens') {
    listeningData.listens = updateSongListensArray(
      updateType,
      listeningData.listens
    );
  } else {
    log(
      `Requested to update song listening data with unknown data type of ${dataType}.`,
      undefined,
      'WARN'
    );
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
    [listeningData.songId]
  );
  return listeningData;
};

const updateSongListeningData = (
  songId: string,
  dataType: ListeningDataTypes,
  updateType: ListeningDataUpdateTypes
) => {
  try {
    log(
      `Requested to ${updateType} ${dataType} of the '${songId}' song's listening data.`
    );
    const listeningData = getListeningData([songId]);

    if (listeningData.length > 0) {
      for (let i = 0; i < listeningData.length; i += 1) {
        if (listeningData[i].songId === songId) {
          const updatedListeningData = updateListeningData(
            dataType,
            listeningData[i],
            updateType
          );
          return setListeningData(updatedListeningData);
        }
      }

      log(
        `No listening data found for songId ${songId}. Creating a new listening data instance.`
      );
      const newListeningData = createNewListeningDataInstance(songId);
      const updatedListeningData = updateListeningData(
        dataType,
        newListeningData,
        updateType
      );
      return setListeningData(updatedListeningData);
    }
    return log('Listening data array empty');
  } catch (error) {
    return log(
      `Error occurred when trying to update song listening data for the song with id ${songId}`,
      { error },
      'ERROR'
    );
  }
};

export default updateSongListeningData;
